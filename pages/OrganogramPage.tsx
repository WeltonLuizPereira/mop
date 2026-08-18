import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Maximize, MousePointer2, Hand } from 'lucide-react';
import { Coordinator, Supervisor, CollaboratorStatus, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { Badge, FilterBar, IconButton, LoadingState, PageToolbar, Select } from '../components/ui';

interface OrgNode {
    id: string;
    name: string;
    role: string;
    type: 'manager' | 'coordinator' | 'supervisor' | 'ilha' | 'collaborator';
    status?: CollaboratorStatus;
    children: OrgNode[];
}

const PAN_STEP = 40;
const ZOOM_STEP = 0.1;
const MIN_SCALE = 0.2;
const MAX_SCALE = 2;
const clampScale = (value: number) => Math.min(Math.max(MIN_SCALE, value), MAX_SCALE);

const NODE_CARD: Record<string, string> = {
    manager: 'min-w-[180px] rounded-lg border-2 border-ink-2 bg-canvas px-4 py-3 text-center shadow-1',
    coordinator: 'min-w-[168px] rounded-md border border-hairline-2 bg-canvas px-3.5 py-2.5 text-center',
    supervisor: 'min-w-[168px] rounded-md border border-dashed border-hairline-2 bg-canvas px-3.5 py-2.5 text-center',
    ilha: 'min-w-[160px] rounded-tile border border-hairline-2 bg-canvas-soft px-4 py-3 text-center',
};
const DEFAULT_CARD = 'min-w-[150px] rounded-md border border-hairline bg-canvas px-3 py-2 text-center';

/**
 * jsdom não implementa `Element.setPointerCapture`/`releasePointerCapture`
 * (v26). Chamamos de forma opcional para funcionar em teste e em navegador.
 */
function capturarPonteiro(el: Element, pointerId: number) {
    (el as Element & { setPointerCapture?: (id: number) => void }).setPointerCapture?.(pointerId);
}
function liberarPonteiro(el: Element, pointerId: number) {
    (el as Element & { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(pointerId);
}

/**
 * Um nó da hierarquia com seus descendentes. Semântica de lista aninhada
 * (`ul`/`li`) para que a estrutura visível também exista para tecnologia
 * assistiva — sem depender do padrão ARIA treeview completo (que exigiria
 * navegação por setas entre itens, fora do escopo aqui: quem navega o
 * organograma é o canvas de pan/zoom, não cada nó).
 */
const HierarchyNode = ({ node, isRoot = false, siblingPosition }: {
    node: OrgNode;
    isRoot?: boolean;
    siblingPosition?: 'first' | 'middle' | 'last';
}) => {
    if (!node) return null;
    const isIlha = node.type === 'ilha';
    const hasChildren = node.children.length > 0;
    const cardClass = NODE_CARD[node.type] ?? DEFAULT_CARD;

    return (
        <li className="relative flex list-none flex-col items-center px-3">
            {!isRoot && siblingPosition && (
                <div
                    aria-hidden="true"
                    className={`absolute -top-px h-px bg-[var(--viz-connector)] ${
                        siblingPosition === 'first' ? 'left-1/2 right-0'
                        : siblingPosition === 'last' ? 'left-0 right-1/2'
                        : 'left-0 right-0'
                    }`}
                />
            )}
            {!isRoot && <div aria-hidden="true" className="h-6 w-px bg-[var(--viz-connector)]" />}

            <div className={cardClass}>
                <div className="t-eyebrow text-ink-faint">{node.role}</div>
                <div className="mt-0.5 max-w-[12rem] truncate text-sm font-semibold text-ink" title={node.name}>
                    {node.name}
                </div>
                {isIlha && (
                    <div className="mt-1 text-[11px] text-ink-mute">
                        {node.children.length} {node.children.length === 1 ? 'colaborador' : 'colaboradores'}
                    </div>
                )}
            </div>

            {isIlha ? (
                <>
                    <div aria-hidden="true" className="h-6 w-px bg-[var(--viz-connector)]" />
                    <ul aria-label={`Colaboradores de ${node.name}`} className="grid w-max grid-cols-2 gap-2.5 rounded-lg border border-hairline bg-canvas-soft p-3">
                        {node.children.length === 0 ? (
                            <li className="col-span-2 list-none p-2 text-center text-xs italic text-ink-faint">
                                Nenhum colaborador nesta ilha.
                            </li>
                        ) : node.children.map(colaborador => (
                            <li key={colaborador.id} className="flex w-44 list-none flex-col justify-between gap-2 rounded-md border border-hairline bg-canvas p-2.5 text-left">
                                <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold text-ink" title={colaborador.name}>{colaborador.name}</div>
                                    <div className="t-data mt-0.5 truncate text-[11px] text-ink-mute">Matrícula {colaborador.id}</div>
                                </div>
                                <div className="flex justify-end">
                                    <Badge status={colaborador.status ?? CollaboratorStatus.ATIVO} />
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            ) : hasChildren && (
                <>
                    <div aria-hidden="true" className="h-6 w-px bg-[var(--viz-connector)]" />
                    <ul aria-label={`Equipe de ${node.name}`} className="flex">
                        {node.children.map((child, index) => (
                            <HierarchyNode
                                key={child.id}
                                node={child}
                                siblingPosition={
                                    node.children.length === 1 ? undefined
                                    : index === 0 ? 'first'
                                    : index === node.children.length - 1 ? 'last'
                                    : 'middle'
                                }
                            />
                        ))}
                    </ul>
                </>
            )}
        </li>
    );
};

export const OrganogramPage = () => {
    const [hierarchy, setHierarchy] = useState<OrgNode | null>(null);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [filterCoord, setFilterCoord] = useState('');
    const [filterSup, setFilterSup] = useState('');
    const [coordinatorsList, setCoordinatorsList] = useState<Coordinator[]>([]);
    const [supervisorsList, setSupervisorsList] = useState<Supervisor[]>([]);

    // Pan & Zoom State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const [tool, setTool] = useState<'hand' | 'mouse'>('hand');

    useEffect(() => {
        const buildHierarchy = async () => {
            const [coords, sups, ilhas, collabs] = await Promise.all([
                db.getCoordinators(),
                db.getSupervisors(),
                db.getIlhas(),
                db.getCollaborators()
            ]);

            setCoordinatorsList(coords);
            setSupervisorsList(sups);

            // Filter out inactive collabs
            const activeCollabs = collabs.filter(c => c.status !== CollaboratorStatus.DESLIGADO);

            // Level 1: Manager (Fixed as requested)
            const root: OrgNode = {
                id: 'root-mgr',
                name: 'Tatiane Tappi',
                role: 'Gerente operacional',
                type: 'manager',
                children: []
            };

            // Sorting Strategy: Roger first, then Thais, then others
            const sortedCoords = [...coords].sort((a, b) => {
                const nameA = a.nome.toUpperCase();
                const nameB = b.nome.toUpperCase();
                const isRogerA = nameA.includes('ROGER');
                const isThaisA = nameA.includes('THAIS');
                const isRogerB = nameB.includes('ROGER');
                const isThaisB = nameB.includes('THAIS');

                if (isRogerA) return -1;
                if (isRogerB) return 1;
                if (isThaisA) return -1;
                if (isThaisB) return 1;
                return nameA.localeCompare(nameB);
            });

            // Filter based on dropdown selection
            let relevantCoords = sortedCoords;
            if (filterCoord) {
                relevantCoords = sortedCoords.filter(c => c.id === filterCoord);
            }

            root.children = relevantCoords.map(c => {
                const coordNode: OrgNode = {
                    id: c.id,
                    name: c.nome,
                    role: 'Coordenador',
                    type: 'coordinator',
                    children: []
                };

                // NEW LOGIC: Hierarchy based on Ilha assignments to handle M:N
                // 1. Find Ilhas assigned to this Coordinator
                let myIlhas = ilhas.filter(i => i.coordinatorIds?.includes(c.id));

                // 2. Identify Supervisors from these Ilhas
                const mySupIds = Array.from(new Set(myIlhas.flatMap(i => i.supervisorIds || [])));

                // 3. Apply Supervisor Filter
                let filteredSupIds = mySupIds;
                if (filterSup) {
                    if (mySupIds.includes(filterSup)) {
                        filteredSupIds = [filterSup];
                    } else {
                        filteredSupIds = [];
                    }
                }

                coordNode.children = filteredSupIds.map(supId => {
                    const supObj = sups.find(s => s.id === supId) || { id: supId, nome: 'Supervisor N/A', coordinatorId: '', status: EntityStatus.ACTIVE };

                    const supervisorNode: OrgNode = {
                        id: `sup-${c.id}-${supId}`, // Unique ID for tree
                        name: supObj.nome,
                        role: 'Supervisor',
                        type: 'supervisor',
                        children: []
                    };

                    // 4. Find Ilhas for this Coordinator AND this Supervisor
                    const specificIlhas = myIlhas.filter(i => i.supervisorIds?.includes(supId));

                    supervisorNode.children = specificIlhas.map(ilha => {
                         const ilhaCollabs = activeCollabs.filter(col => col.ilhaId === ilha.id);

                         return {
                            id: `ilha-${c.id}-${supId}-${ilha.id}`,
                            name: ilha.nome,
                            role: 'Ilha',
                            type: 'ilha' as const,
                            children: ilhaCollabs.map(col => ({
                                id: col.matricula,
                                name: col.nome,
                                role: 'Colaborador',
                                status: col.status,
                                type: 'collaborator' as const,
                                children: [] as OrgNode[],
                            })),
                         };
                    });

                    return supervisorNode;
                }).filter(s => s.children.length > 0 || !filterSup);

                return coordNode;
            }).filter(c => c.children.length > 0 || (!filterSup && !filterCoord) || (filterCoord && !filterSup));

            setHierarchy(root);
            setLoading(false);
        };
        buildHierarchy();
    }, [filterCoord, filterSup]);

    // ... Pan & Zoom, unificados em Pointer Events (mouse, toque e caneta) ...
    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (tool !== 'hand') return;
        const delta = e.deltaY * -0.001;
        setScale(s => clampScale(s + delta));
    };
    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (tool !== 'hand') return;
        capturarPonteiro(e.currentTarget, e.pointerId);
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging || tool !== 'hand') return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        liberarPonteiro(e.currentTarget, e.pointerId);
        setIsDragging(false);
    };
    const resetView = () => { setScale(1); setPosition({ x: 0, y: 0 }); };
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case 'ArrowUp': e.preventDefault(); setPosition(p => ({ ...p, y: p.y - PAN_STEP })); break;
            case 'ArrowDown': e.preventDefault(); setPosition(p => ({ ...p, y: p.y + PAN_STEP })); break;
            case 'ArrowLeft': e.preventDefault(); setPosition(p => ({ ...p, x: p.x - PAN_STEP })); break;
            case 'ArrowRight': e.preventDefault(); setPosition(p => ({ ...p, x: p.x + PAN_STEP })); break;
            case '+': case '=': e.preventDefault(); setScale(s => clampScale(s + ZOOM_STEP)); break;
            case '-': case '_': e.preventDefault(); setScale(s => clampScale(s - ZOOM_STEP)); break;
            case 'Home': e.preventDefault(); resetView(); break;
            default: break;
        }
    };

    const hasActiveFilters = Boolean(filterCoord || filterSup);
    const clearFilters = () => { setFilterCoord(''); setFilterSup(''); };

    return (
        <div className="flex flex-col gap-5">
            <PageToolbar description="Navegue pela hierarquia operacional. Arraste, use a roda do mouse, toque ou o teclado para alcançar toda a estrutura." />

            <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
                <div className="grid grid-cols-1 gap-3 sm:max-w-md sm:grid-cols-2">
                    <Select label="Coordenador" value={filterCoord} onChange={e => setFilterCoord(e.target.value)}>
                        <option value="">Todos os coordenadores</option>
                        {coordinatorsList.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </Select>
                    <Select label="Supervisor" value={filterSup} onChange={e => setFilterSup(e.target.value)}>
                        <option value="">Todos os supervisores</option>
                        {supervisorsList.filter(s => !filterCoord || s.coordinatorIds?.includes(filterCoord)).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                    </Select>
                </div>
            </FilterBar>

            {loading || !hierarchy ? (
                <div className="flex-1 rounded-lg border border-hairline bg-canvas-soft">
                    <LoadingState label="Carregando organograma" />
                </div>
            ) : (
                <div
                    ref={containerRef}
                    role="region"
                    aria-label="Organograma operacional"
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                    onWheel={handleWheel}
                    className={`relative min-h-[420px] flex-1 select-none overflow-hidden rounded-lg border border-hairline bg-canvas-soft ${
                        tool === 'hand'
                            ? `touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`
                            : 'cursor-default overflow-auto'
                    }`}
                >
                    <div
                        className="flex justify-center pb-8 pt-10"
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: 'top center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        }}
                    >
                        <ul aria-label="Hierarquia organizacional" className="flex justify-center">
                            <HierarchyNode node={hierarchy} isRoot />
                        </ul>
                    </div>

                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-md border border-hairline bg-canvas p-1 shadow-1">
                        <IconButton
                            label="Mover"
                            icon={<Hand size={16} />}
                            size="sm"
                            variant={tool === 'hand' ? 'primary' : 'ghost'}
                            aria-pressed={tool === 'hand'}
                            onClick={() => setTool('hand')}
                        />
                        <IconButton
                            label="Selecionar"
                            icon={<MousePointer2 size={16} />}
                            size="sm"
                            variant={tool === 'mouse' ? 'primary' : 'ghost'}
                            aria-pressed={tool === 'mouse'}
                            onClick={() => setTool('mouse')}
                        />
                        <div aria-hidden="true" className="mx-0.5 h-5 w-px bg-hairline" />
                        <IconButton
                            label="Aumentar zoom"
                            icon={<Plus size={16} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => setScale(s => clampScale(s + ZOOM_STEP))}
                        />
                        <IconButton
                            label="Diminuir zoom"
                            icon={<Minus size={16} />}
                            size="sm"
                            variant="ghost"
                            onClick={() => setScale(s => clampScale(s - ZOOM_STEP))}
                        />
                        <IconButton
                            label="Redefinir posição e zoom"
                            icon={<Maximize size={16} />}
                            size="sm"
                            variant="ghost"
                            onClick={resetView}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
