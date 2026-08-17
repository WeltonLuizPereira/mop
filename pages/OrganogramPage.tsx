import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown, Loader2, Maximize, MousePointer2, Hand } from 'lucide-react';
import { Coordinator, Supervisor, CollaboratorStatus, EntityStatus } from '../types';
import { db } from '../services/mockDb';
import { Badge } from '../components/ui';

export const OrganogramPage = () => {
    // ... same as original ...
    const [hierarchy, setHierarchy] = useState<any>(null);
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
            const root = {
                id: 'root-mgr',
                name: 'Tatiane Tappi',
                role: 'GERENTE OPERACIONAL',
                type: 'manager',
                children: [] as any[]
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
                const coordNode = {
                    id: c.id,
                    name: c.nome,
                    role: 'COORDENADOR',
                    type: 'coordinator',
                    children: [] as any[]
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
                    
                    const supervisorNode = {
                        id: `sup-${c.id}-${supId}`, // Unique ID for tree
                        name: supObj.nome,
                        role: 'SUPERVISOR',
                        type: 'supervisor',
                        children: [] as any[]
                    };

                    // 4. Find Ilhas for this Coordinator AND this Supervisor
                    const specificIlhas = myIlhas.filter(i => i.supervisorIds?.includes(supId));

                    supervisorNode.children = specificIlhas.map(ilha => {
                         const ilhaCollabs = activeCollabs.filter(col => col.ilhaId === ilha.id);

                         return {
                            id: `ilha-${c.id}-${supId}-${ilha.id}`,
                            name: ilha.nome,
                            role: 'ILHA',
                            type: 'ilha',
                            children: ilhaCollabs.map(col => ({
                                id: col.matricula,
                                name: col.nome,
                                role: 'COLABORADOR',
                                status: col.status,
                                type: 'collaborator'
                            }))
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

    // ... Pan & Zoom ...
    const handleWheel = (e: React.WheelEvent) => {
        if (tool === 'hand') {
            const delta = e.deltaY * -0.001;
            const newScale = Math.min(Math.max(0.2, scale + delta), 2);
            setScale(newScale);
        }
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        if (tool === 'mouse') return;
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || tool === 'mouse') return;
        setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    // ... TreeNode ...
    const TreeNode = ({ node }: { node: any }) => {
        if (!node) return null;
        const hasChildren = node.children && node.children.length > 0;
        const isIlhaNode = node.type === 'ilha';
        
        // ... node styles ...
        let cardStyle = "bg-white border-2 p-3 rounded-lg shadow-sm min-w-[180px] text-center relative z-10 transition-shadow hover:shadow-md";
        let headerColor = "";
        if (node.type === 'manager') { cardStyle += " border-emerald-500"; headerColor = "text-emerald-700 bg-emerald-50"; } 
        else if (node.type === 'coordinator') { cardStyle += " border-blue-500"; headerColor = "text-blue-700 bg-blue-50"; }
        else if (node.type === 'supervisor') { cardStyle += " border-orange-500"; headerColor = "text-orange-700 bg-orange-50"; }
        else if (node.type === 'ilha') { cardStyle += " border-indigo-500 min-w-[160px]"; headerColor = "text-indigo-700 bg-indigo-50"; }
        else { cardStyle += " border-gray-200 min-w-[150px]"; headerColor = "text-gray-600"; }

        if (isIlhaNode) {
            return (
                <div className="flex flex-col items-center mx-4">
                    <div className={cardStyle}>
                         <div className={`text-[10px] font-bold uppercase mb-1 rounded px-1 py-0.5 ${headerColor}`}>{node.role}</div>
                        <div className="font-bold text-sm text-gray-900 leading-tight">{node.name}</div>
                        <div className="mt-1 text-[10px] text-gray-500 font-medium">{node.children.length} Colaboradores</div>
                    </div>
                    <div className="w-px h-8 bg-gray-300"></div>
                    <div className="grid grid-cols-2 gap-4 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100 relative w-max">
                        <div className="absolute -top-3 left-1/2 w-px h-3 bg-gray-300"></div>
                        {node.children.map((child: any) => (
                             <div key={child.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm text-left flex flex-col justify-between w-44 hover:border-brand-300 transition-colors">
                                 <div className="mb-2">
                                     <div className="font-bold text-xs text-gray-900 truncate" title={child.name}>{child.name}</div>
                                     <div className="text-[10px] text-gray-500 font-medium truncate mt-0.5">Matrícula: {child.id}</div>
                                 </div>
                                 <div className="flex justify-end mt-1"><Badge status={child.status}/></div>
                             </div>
                        ))}
                         {node.children.length === 0 && <div className="col-span-2 text-xs text-gray-400 p-2 italic text-center">Nenhum colaborador nesta ilha/supervisor.</div>}
                    </div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center mx-4">
                <div className={cardStyle}>
                    <div className={`text-[10px] font-bold uppercase mb-1 rounded px-1 py-0.5 ${headerColor}`}>{node.role}</div>
                    <div className="font-bold text-sm text-gray-900 leading-tight">{node.name}</div>
                </div>
                {hasChildren && (
                    <>
                        <div className="w-px h-6 bg-gray-300"></div>
                        <div className="flex relative">
                            {node.children.length > 1 && <div className="absolute top-0 left-[calc(50%-50%)] right-[calc(50%-50%)] h-px bg-gray-300"></div>}
                             <div className="flex items-start pt-6 relative before:content-[''] before:absolute before:top-0 before:left-0 before:w-full before:h-px before:bg-gray-300">
                                {node.children.map((child: any) => (
                                    <div key={child.id} className="relative flex flex-col items-center before:content-[''] before:absolute before:-top-6 before:left-1/2 before:-ml-px before:w-px before:h-6 before:bg-gray-300 first:before:bg-transparent last:before:bg-transparent only:before:bg-gray-300"> 
                                        <div className="absolute -top-6 left-0 w-1/2 h-px bg-white first:block hidden"></div>
                                        <div className="absolute -top-6 right-0 w-1/2 h-px bg-white last:block hidden"></div>
                                        <div className="absolute -top-6 left-1/2 w-px h-6 bg-gray-300"></div>
                                        <TreeNode node={child} />
                                    </div>
                                ))}
                             </div>
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-500">
            {/* ... organogram controls ... */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Organograma Operacional</h2>
                <div className="flex gap-4">
                    <div className="flex gap-2">
                        <select className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500" value={filterCoord} onChange={(e) => setFilterCoord(e.target.value)}>
                            <option value="">Todos Coordenadores</option>
                            {coordinatorsList.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                        <select className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-brand-500" value={filterSup} onChange={(e) => setFilterSup(e.target.value)}>
                            <option value="">Todos Supervisores</option>
                            {supervisorsList.filter(s => !filterCoord || s.coordinatorIds?.includes(filterCoord)).map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-sm">
                        <button onClick={() => setTool('hand')} className={`p-2 rounded-md transition-colors ${tool === 'hand' ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><Hand size={18} /></button>
                         <div className="w-px h-6 bg-gray-200"></div>
                        <button onClick={() => { setTool('mouse'); }} className={`p-2 rounded-md transition-colors ${tool === 'mouse' ? 'bg-brand-50 text-brand-600' : 'text-gray-400 hover:text-gray-600'}`}><MousePointer2 size={18} /></button>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 bg-gray-100 rounded-xl border border-gray-300 relative overflow-hidden select-none">
                 <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 bg-white rounded-lg shadow-md p-2">
                     <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><Plus size={16}/></button>
                     <button onClick={() => setScale(s => Math.max(s - 0.1, 0.2))} className="p-1 hover:bg-gray-100 rounded text-gray-600"><ChevronDown size={16}/></button>
                     <button onClick={() => { setScale(1); setPosition({x:0, y:0}); }} className="p-1 hover:bg-gray-100 rounded text-gray-600" title="Reset"><Maximize size={16}/></button>
                 </div>
                 
                 <div ref={containerRef} className={`w-full h-full overflow-hidden flex items-start justify-center pt-10 ${tool === 'hand' ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default overflow-auto'}`} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
                     <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transformOrigin: 'top center', transition: isDragging ? 'none' : 'transform 0.1s ease-out' }}>
                         <TreeNode node={hierarchy} />
                     </div>
                 </div>
            </div>
        </div>
    );
};
