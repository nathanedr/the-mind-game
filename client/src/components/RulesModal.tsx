import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const RulesModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);
    const close = () => setIsOpen(false);

    return (
        <>
            {/* Icone Livre (Bas Droite) */}
            <div 
                className="fixed bottom-4 right-4 z-50 cursor-pointer bg-slate-800 p-3 rounded-full shadow-lg border border-slate-600 hover:bg-slate-700 transition-colors"
                onClick={toggleOpen}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
            </div>

            {/* Modal / Tooltip */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-20 right-4 w-80 md:w-96 bg-slate-900/95 backdrop-blur-md border border-slate-600 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[80vh]"
                    >
                        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                            <h3 className="font-bold text-white text-lg">Règles de MindLink</h3>
                            <button onClick={close} className="text-slate-400 hover:text-white transition-colors p-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-4 overflow-y-auto text-slate-300 text-sm space-y-4 custom-scrollbar">
                            <section>
                                <h4 className="font-bold text-indigo-400 mb-1">But du jeu</h4>
                                <p>L'équipe doit réussir tous les niveaux en posant les cartes dans l'ordre croissant (1 à 100).</p>
                            </section>

                            <section>
                                <h4 className="font-bold text-indigo-400 mb-1">Les Niveaux</h4>
                                <p>Le nombre de cartes en main dépend du niveau :</p>
                                <ul className="list-disc pl-4 space-y-1 mt-1 text-slate-400">
                                    <li><strong>Niveau 1</strong> : 1 carte chacun.</li>
                                    <li><strong>Niveau 2</strong> : 2 cartes chacun.</li>
                                    <li>...</li>
                                    <li><strong>Niveau 12</strong> : 12 cartes chacun !</li>
                                </ul>
                            </section>

                            <section>
                                <h4 className="font-bold text-indigo-400 mb-1">Communication (2 Variantes)</h4>
                                <div className="space-y-2">
                                    <div className="bg-red-900/20 p-2 rounded border border-red-800/50">
                                        <strong className="text-red-300 block">1. Stricte (Hardcore)</strong>
                                        <p className="text-xs">Silence total. Pas de mots, pas de signes, pas de hochements de tête. On se connecte par la pensée !</p>
                                    </div>
                                    <div className="bg-emerald-900/20 p-2 rounded border border-emerald-800/50">
                                        <strong className="text-emerald-300 block">2. Ouverte (Détente)</strong>
                                        <p className="text-xs">Interdit de dire les nombres ("J'ai 42") ou des intervalles ("J'ai entre 10 et 20").<br/>
                                        Mais on peut dire : "Je suis chaud", "J'hésite", "J'ai une très petite carte", "Attendez un peu".</p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="font-bold text-indigo-400 mb-1">Exemples de Jeu</h4>
                                <div className="space-y-2 text-xs">
                                    <p>
                                        <strong className="text-slate-200">Déroulement :</strong><br/>
                                        Alice a <strong>15</strong>, Bob a <strong>42</strong>.<br/>
                                        Alice doit sentir que c'est à elle et poser son 15. Si Bob s'impatiente et pose son 42 avant, c'est une erreur car 15 &lt; 42.
                                    </p>
                                    <p>
                                        <strong className="text-slate-200">Vies (♥) :</strong><br/>
                                        Si Bob joue 42 alors qu'Alice a 15, le jeu s'arrête. Alice montre son 15, on le met de côté, et l'équipe perd <strong>1 Vie</strong>. Si 0 vie = Game Over.
                                    </p>
                                    <p>
                                        <strong className="text-slate-200">Shuriken (★) :</strong><br/>
                                        Alice propose un Shuriken. Bob accepte.<br/>
                                        Alice défausse sa carte la plus basse (ex: 15).<br/>
                                        Bob défausse sa carte la plus basse (ex: 42).<br/>
                                        On continue le jeu avec les cartes restantes.
                                    </p>
                                </div>
                            </section>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
