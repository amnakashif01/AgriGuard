"use client";

import { useState } from "react";

type CropImageHighlight = {
    boundingBox?: number[] | { ymin: number; xmin: number; ymax: number; xmax: number };
    reasoning?: string;
};

type CropImageHighlightsProps = {
    src: string;
    alt: string;
    highlights?: CropImageHighlight[];
    className?: string;
    showEmptyState?: boolean;
    showReviewingState?: boolean;
    showReviewFailedState?: boolean;
};

function toPercent(value: number, arrayCoordinates: boolean, arrayIsNormalized: boolean): number {
    const scaled = arrayCoordinates ? value * (arrayIsNormalized ? 100 : 0.1) : value * 100;
    return Math.max(0, Math.min(100, scaled));
}

export default function CropImageHighlights({ src, alt, highlights = [], className = "", showEmptyState = false, showReviewingState = false, showReviewFailedState = false }: CropImageHighlightsProps) {
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
    const positionedHighlights = naturalSize.width > 0 ? highlights.flatMap((highlight, index) => {
        const box = highlight.boundingBox;
        if (!box) return [];

        const isArray = Array.isArray(box);
        const coords = isArray
            ? box
            : [(box as Exclude<typeof box, number[]>).ymin, (box as Exclude<typeof box, number[]>).xmin,
                (box as Exclude<typeof box, number[]>).ymax, (box as Exclude<typeof box, number[]>).xmax];
        if (coords.length < 4 || coords.slice(0, 4).some(value => !Number.isFinite(value))) return [];

        const arrayIsNormalized = isArray && coords.slice(0, 4).every(value => Math.abs(value) <= 1);
        const [rawTop, rawLeft, rawBottom, rawRight] = coords;
        const top = toPercent(Math.min(rawTop, rawBottom), isArray, arrayIsNormalized);
        const bottom = toPercent(Math.max(rawTop, rawBottom), isArray, arrayIsNormalized);
        const left = toPercent(Math.min(rawLeft, rawRight), isArray, arrayIsNormalized);
        const right = toPercent(Math.max(rawLeft, rawRight), isArray, arrayIsNormalized);
        const width = right - left;
        const height = bottom - top;
        if (width <= 0 || height <= 0) return [];

        const diameter = Math.max(
            width * naturalSize.width / 100,
            height * naturalSize.height / 100,
            Math.min(naturalSize.width, naturalSize.height) * 0.035
        );
        return [{
            highlight,
            index,
            left: (left + right) / 2,
            top: (top + bottom) / 2,
            width: diameter / naturalSize.width * 100,
            height: diameter / naturalSize.height * 100,
        }];
    }) : [];

    return (
        <div className={`relative w-full ${className}`}>
            <img
                src={src}
                alt={alt}
                className="block h-auto w-full rounded-lg"
                onLoad={event => setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                })}
            />
            {naturalSize.width > 0 && positionedHighlights.length > 0 && (
                <div className="absolute left-2 top-2 z-20 flex items-center gap-2 rounded-md border border-red-200 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-red-800 shadow-md">
                    <span className="h-3 w-3 rounded-full border-2 border-white bg-red-700 shadow-[0_0_0_1px_rgba(185,28,28,0.8)]" />
                    Disease-affected area
                </div>
            )}
            {naturalSize.width > 0 && showReviewingState && (
                <div role="status" className="absolute bottom-2 left-2 right-2 rounded-md border border-sky-200 bg-white/95 px-3 py-2 text-xs font-medium text-sky-900 shadow-md">
                    Checking this image for additional affected spots...
                </div>
            )}
            {naturalSize.width > 0 && showReviewFailedState && (
                <div role="status" className="absolute bottom-2 left-2 right-2 rounded-md border border-amber-200 bg-white/95 px-3 py-2 text-xs font-medium text-amber-900 shadow-md">
                    Could not check for additional spots. Existing circles may not show every affected area.
                </div>
            )}
            {naturalSize.width > 0 && showEmptyState && !showReviewingState && positionedHighlights.length === 0 && (
                <div role="status" className="absolute bottom-2 left-2 right-2 rounded-md border border-amber-200 bg-white/95 px-3 py-2 text-xs font-medium text-amber-900 shadow-md">
                    No affected area could be marked in this image. Retake a clear close-up or request expert review.
                </div>
            )}
            {positionedHighlights.map(({ highlight, index, left, top, width, height }) => (
                    <div
                        key={index}
                        aria-label={highlight.reasoning || `Affected area ${index + 1}`}
                        className="pointer-events-none absolute rounded-full border-[3px] border-red-700 bg-red-600/20 shadow-[0_0_0_2px_rgba(255,255,255,0.98),0_0_0_4px_rgba(185,28,28,0.8)]"
                        style={{
                            left: `${left}%`,
                            top: `${top}%`,
                            width: `${width}%`,
                            height: `${height}%`,
                            minWidth: 18,
                            minHeight: 18,
                            transform: "translate(-50%, -50%)",
                        }}
                    >
                        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-700 px-1 text-[10px] font-bold leading-none text-white shadow-md">
                            {index + 1}
                        </span>
                    </div>
                ))}
        </div>
    );
}