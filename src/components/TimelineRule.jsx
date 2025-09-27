/**
 * TimelineRule.jsx v3.1 - SYNTAX FIX
 * ✅ REFACTOR: Removed global `window.photoDataV2` dependency.
 * ✅ NEW: Receives momentsData directly via props for better reliability.
 * ✅ FIX: Corrected syntax error in React import.
 */

import React, { useState, useEffect } from 'react'; // ✅ CORRIGÉ
import { ChevronLeft, ChevronRight, Camera, FileText } from 'lucide-react';
import { useAppState } from '../hooks/useAppState.js';

const TimelineRule = ({ onMomentSelect, selectedMoment = null }) => {
  const { masterIndex } = useAppState();
  const [momentsData, setMomentsData] = useState([]);
  const [viewSize, setViewSize] = useState(15);
  const [currentDay, setCurrentDay] = useState(0);

  useEffect(() => {
    const updateViewSize = () => {
      const width = window.innerWidth;
      setViewSize(width < 768 ? 10 : width < 1024 ? 15 : 20);
    };
    updateViewSize();
    window.addEventListener('resize', updateViewSize);
    return () => window.removeEventListener('resize', updateViewSize);
  }, []);

  useEffect(() => {
    if (masterIndex && masterIndex.moments) {
      const enrichedMoments = masterIndex.moments.map(m => ({
        ...m,
        postCount: m.posts?.length || 0,
        photoCount: (m.dayPhotos?.length || 0) + (m.postPhotos?.length || 0),
      }));
      setMomentsData(enrichedMoments);
    }
  }, [masterIndex]);

  useEffect(() => {
    if (selectedMoment) {
      setCurrentDay(selectedMoment.dayStart);
    }
  }, [selectedMoment]);

  const navigate = (direction) => {
    const step = Math.floor(viewSize / 2) || 1;
    const newDay = currentDay + (direction * step);
    const maxDay = masterIndex?.metadata?.day_range?.end || 200;
    setCurrentDay(Math.max(0, Math.min(newDay, maxDay)));
  };
  
  const jumpToCountry = (day) => {
      setCurrentDay(day);
  };

  const getVisibleDays = () => {
      const days = [];
      const start = Math.max(0, currentDay - Math.floor(viewSize / 2));
      for (let i = 0; i < viewSize; i++) {
          days.push(start + i);
      }
      return days;
  };
  
  const visibleDays = getVisibleDays();
  const viewStartDay = visibleDays[0];
  const viewEndDay = visibleDays[visibleDays.length - 1];

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm select-none">
      <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-center space-x-1">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded hover:bg-gray-200"><ChevronLeft className="w-4 h-4" /></button>
            {[
                { name: 'Début', day: 0 }, { name: 'Thaïlande', day: 1 }, { name: 'Laos N.', day: 24 },
                { name: 'Vietnam', day: 47 }, { name: 'Laos S.', day: 72 }, { name: 'Cambodge', day: 101 }
            ].map(c => (
                <button key={c.name} onClick={() => jumpToCountry(c.day)} className="px-2.5 py-1 rounded text-xs transition-colors text-gray-600 hover:bg-gray-200">{c.name}</button>
            ))}
            <button onClick={() => navigate(1)} className="p-1.5 rounded hover:bg-gray-200"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="relative h-24 w-full p-2">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-300 -translate-y-1/2"></div>
        <div className="relative flex justify-between h-full">
            {visibleDays.map(day => (
                <div key={day} className="flex-1 flex justify-center items-center">
                    <div className="h-2 w-px bg-gray-300"></div>
                    {(day % 5 === 0 || day === 0) && (
                        <span className="absolute top-[calc(50%+8px)] text-xs text-gray-400">{`J${day}`}</span>
                    )}
                </div>
            ))}
        </div>
        <div className="absolute inset-0">
            {momentsData
                .filter(m => m.dayEnd >= viewStartDay && m.dayStart <= viewEndDay)
                .map((moment, index) => {
                    const left = ((moment.dayStart - viewStartDay) / viewSize) * 100;
                    const width = (Math.min(moment.dayEnd, viewEndDay) - Math.max(moment.dayStart, viewStartDay) + 1) / viewSize * 100;
                    const isSelected = selectedMoment && selectedMoment.id === moment.id;
                    const positionStyle = {
                        left: `${Math.max(0, left)}%`,
                        width: `${Math.max(8, width)}%`
                    };

                    return (
                        <div key={moment.id} className="absolute h-full" style={positionStyle}>
                            <div
                                className={`absolute w-full px-2 py-1 rounded-md border text-xs truncate cursor-pointer transition-all duration-200 ${
                                    isSelected ? 'bg-blue-100 border-blue-400 shadow-lg z-20' : 'bg-white border-gray-300 hover:bg-gray-50 z-10'
                                }`}
                                style={{ top: `${(index % 2 === 0) ? '0px' : '52px'}` }}
                                title={moment.title}
                                onClick={() => onMomentSelect(moment)}
                            >
                               <span className={isSelected ? 'font-semibold text-blue-800' : ''}>{moment.title}</span>
                            </div>
                            
                            <div className="absolute w-full flex justify-center items-center h-full">
                                <div className={`absolute flex gap-x-2 ${(index % 2 === 0) ? '-bottom-1' : '-top-1'}`}>
                                    {moment.postCount > 0 && (
                                       <span className="flex items-center text-xs text-blue-600 bg-white/80 backdrop-blur-sm px-1 rounded-full">
                                           <FileText className="w-3 h-3 mr-0.5" /> {moment.postCount}
                                       </span>
                                    )}
                                    {moment.photoCount > 0 && (
                                       <span className="flex items-center text-xs text-green-600 bg-white/80 backdrop-blur-sm px-1 rounded-full">
                                           <Camera className="w-3 h-3 mr-0.5" /> {moment.photoCount}
                                       </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            }
        </div>
      </div>
    </div>
  );
};

export default TimelineRule;

