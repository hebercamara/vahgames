import React from 'react';

const ResultGallery = ({ results, onRestart }) => {
    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto">
            <h2 className="mb-6 text-center text-[26px] font-black text-violet-bright md:mb-8 md:text-4xl">A grande revelação!</h2>

            <div className="grid grid-cols-1 gap-8 w-full">
                {results.map((chain, chainIndex) => (
                    <div key={chainIndex} className="bg-white/[0.07] rounded-xs p-4 md:p-6 border border-line">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-4 border-b border-line pb-2">
                            <span className="text-[20px] md:text-2xl font-bold text-lime">Palavra original: {chain.initialWord}</span>
                            {chain.owner && <span className="text-muted text-sm">({chain.owner})</span>}
                        </div>

                        <div className="flex flex-col gap-3 pb-2 md:flex-row md:items-center md:gap-4 md:overflow-x-auto md:pb-4">
                            {chain.steps.map((step, i) => (
                                <div key={i} className="flex flex-col items-center md:flex-shrink-0">
                                    <div className="bg-canvas p-2 rounded border border-line w-full aspect-[4/3] md:w-64 md:h-48 md:aspect-auto flex items-center justify-center relative">
                                        {step.type === 'drawing' ? (
                                            <img src={step.content} alt="drawing" className="max-w-full max-h-full" />
                                        ) : (
                                            <p className="text-xl font-bold text-ink text-center">"{step.content}"</p>
                                        )}
                                        <span className="absolute top-1 right-1 text-xs text-muted bg-black/50 px-1 rounded">
                                            {step.author}
                                        </span>
                                    </div>
                                    {i < chain.steps.length - 1 && <div className="h-4 w-0.5 bg-line mt-3 md:hidden" aria-hidden="true"></div>}
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
                Jogar de novo
            </button>
        </div>
    );
};

export default ResultGallery;
