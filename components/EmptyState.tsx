import React from 'react';
import { CameraIcon } from './Icons';

interface Props {
  onAdd: () => void;
}

const EmptyState: React.FC<Props> = ({ onAdd }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-xmu-50 p-6 rounded-full mb-6">
        <CameraIcon className="w-12 h-12 text-xmu-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">还没有流浪猫档案</h3>
      <p className="text-gray-500 mb-8 max-w-xs">
        如果你在校园里遇到了流浪猫，点击下方按钮来登记第一只猫咪吧！
      </p>
      <button
        onClick={onAdd}
        className="bg-xmu-600 hover:bg-xmu-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-xmu-500/30 transition-all active:scale-95 flex items-center gap-2"
      >
        <CameraIcon className="w-5 h-5" />
        <span>开始识别</span>
      </button>
    </div>
  );
};

export default EmptyState;
