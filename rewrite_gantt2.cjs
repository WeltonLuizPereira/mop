const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');

const startTarget = `<div className="border border-gray-200 rounded-xl bg-white overflow-hidden flex flex-col" style={{ flex: 1, minHeight: 0 }}>`;
const endTarget = `                                            {filtered.length === 0 && (
                                                <div className="text-center text-gray-400 py-12 w-full absolute left-0">
                                                    Nenhum contrato encontrado.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;

const startIdx = code.indexOf(startTarget);
const endIdx = code.indexOf(endTarget, startIdx);
console.log("start", startIdx, "end", endIdx);
