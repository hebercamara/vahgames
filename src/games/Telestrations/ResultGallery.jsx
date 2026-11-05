import React from 'react';

const ResultGallery = ({ results, onRestart }) => {
    return (
        <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4">
            <h2 className="text-4xl font-bold text-yellow-400 mb-8">A Grande Revelação!</h2>

            <div className="grid grid-cols-1 gap-8 w-full">
                {results.map((chain, chainIndex) => (
                    <div key={chainIndex} className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
                        <div className="flex items-center gap-4 mb-4 border-b border-gray-600 pb-2">
                            <span className="text-2xl font-bold text-green-400">Palavra Original: {chain.initialWord}</span>
                            <span className="text-gray-400 text-sm">({chain.owner})</span>
                        </div>

                        <div className="flex flex-row overflow-x-auto gap-4 pb-4 items-center">
                            {chain.steps.map((step, i) => (
                                <div key={i} className="flex-shrink-0 flex flex-col items-center">
                                    <div className="bg-gray-900 p-2 rounded border border-gray-600 w-64 h-48 flex items-center justify-center relative">
                                        {step.type === 'drawing' ? (
                                            <img src={step.content} alt="drawing" className="max-w-full max-h-full" />
                                        ) : (
                                            <p className="text-xl font-bold text-white text-center">"{step.content}"</p>
                                        )}
                                        <span className="absolute top-1 right-1 text-xs text-gray-400 bg-black/50 px-1 rounded">
                                            {step.author}
                                        </span>
                                    </div>
                                    <div className="h-8 w-0.5 bg-gray-600 my-1"></div> {/* Connector line (conceptual) */}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={onRestart}
                className="mt-12 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-xl shadow-lg transition"
            >
                Jogar Novamente
            </button>
        </div>
    );
};

export default ResultGallery;
