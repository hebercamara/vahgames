import React from 'react';

const ResultGallery = ({ results, onRestart }) => {
    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4">
            <h2 className="text-4xl font-bold text-violet-bright mb-8">A Grande Revelação!</h2>

            <div className="grid grid-cols-1 gap-8 w-full">
                {results.map((chain, chainIndex) => (
                    <div key={chainIndex} className="bg-white/[0.07] rounded-xs p-6 border border-line">
                        <div className="flex items-center gap-4 mb-4 border-b border-line pb-2">
                            <span className="text-2xl font-bold text-lime">Palavra Original: {chain.initialWord}</span>
                            <span className="text-muted text-sm">({chain.owner})</span>
                        </div>

                        <div className="flex flex-row overflow-x-auto gap-4 pb-4 items-center">
                            {chain.steps.map((step, i) => (
                                <div key={i} className="flex-shrink-0 flex flex-col items-center">
                                    <div className="bg-canvas p-2 rounded border border-line w-64 h-48 flex items-center justify-center relative">
                                        {step.type === 'drawing' ? (
                                            <img src={step.content} alt="drawing" className="max-w-full max-h-full" />
                                        ) : (
                                            <p className="text-xl font-bold text-ink text-center">"{step.content}"</p>
                                        )}
                                        <span className="absolute top-1 right-1 text-xs text-muted bg-black/50 px-1 rounded">
                                            {step.author}
                                        </span>
                                    </div>
                                    <div className="h-8 w-0.5 bg-line my-1"></div> {/* Connector line (conceptual) */}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onRestart}
                className="btn-lime mt-12 px-8"
            >
                Jogar Novamente
            </button>
        </div>
    );
};

export default ResultGallery;
