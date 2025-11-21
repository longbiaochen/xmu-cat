import React, { useState, useEffect, useCallback } from 'react';
import { CatProfile, CatStatus, Gender } from './types';
import { analyzeCatImage } from './services/geminiService';
import { compressImage } from './utils/imageUtils';
import { PlusIcon, HomeIcon, SearchIcon, CameraIcon, TrashIcon, EditIcon, MapPinIcon, CatIcon } from './components/Icons';
import EmptyState from './components/EmptyState';

// Mock data for initial state
const INITIAL_CATS: CatProfile[] = [
  {
    id: '1',
    name: '大白',
    location: '芙蓉隧道口',
    breed: '中华田园猫（白猫）',
    color: '全白',
    estimatedAge: '3岁',
    gender: Gender.MALE,
    status: CatStatus.HEALTHY,
    features: '眼睛异色，左耳微缺',
    imageUrl: 'https://picsum.photos/id/40/500/500', // Placeholder
    lastSeen: Date.now() - 86400000 * 2,
    notes: '性格温顺，喜欢吃火腿肠'
  },
  {
    id: '2',
    name: '警长',
    location: '图书馆东门',
    breed: '黑白猫',
    color: '黑白',
    estimatedAge: '1.5岁',
    gender: Gender.FEMALE,
    status: CatStatus.SICK,
    features: '鼻子上有黑点，像警长胡子',
    imageUrl: 'https://picsum.photos/id/219/500/500', // Placeholder
    lastSeen: Date.now() - 3600000 * 4,
    notes: '最近有点拉肚子，已喂药'
  }
];

type View = 'HOME' | 'ADD_PHOTO' | 'ADD_DETAILS' | 'DETAIL' | 'EDIT';

function App() {
  // State
  const [cats, setCats] = useState<CatProfile[]>(() => {
    const saved = localStorage.getItem('xmu_cats');
    return saved ? JSON.parse(saved) : INITIAL_CATS;
  });
  const [view, setView] = useState<View>('HOME');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState<Partial<CatProfile>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Persist
  useEffect(() => {
    localStorage.setItem('xmu_cats', JSON.stringify(cats));
  }, [cats]);

  // Navigation Helpers
  const goHome = () => {
    setView('HOME');
    setFormData({});
    setAnalysisError(null);
  };

  const goDetail = (id: string) => {
    setSelectedCatId(id);
    setView('DETAIL');
  };

  // Actions
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setView('ADD_DETAILS'); // Move to form immediately to show loader

    try {
      // 1. Compress image
      const compressedBase64 = await compressImage(file, 800, 0.8);
      setFormData(prev => ({ ...prev, imageUrl: compressedBase64 }));

      // 2. Analyze with Gemini
      const analysis = await analyzeCatImage(compressedBase64);
      
      // 3. Pre-fill form
      setFormData(prev => ({
        ...prev,
        breed: analysis.breed,
        color: analysis.color,
        estimatedAge: analysis.estimatedAge,
        features: analysis.features,
        notes: `${analysis.visualHealthAssessment}\n推荐名字: ${analysis.possibleNameSuggestions.join(', ')}`
      }));
    } catch (err) {
      console.error(err);
      setAnalysisError("AI 识别失败，请手动输入信息。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;

    if (view === 'ADD_DETAILS') {
      const newCat: CatProfile = {
        id: Date.now().toString(),
        name: formData.name!,
        location: formData.location!,
        breed: formData.breed || '未知',
        color: formData.color || '未知',
        estimatedAge: formData.estimatedAge || '未知',
        gender: formData.gender || Gender.UNKNOWN,
        status: formData.status || CatStatus.UNKNOWN,
        features: formData.features || '',
        imageUrl: formData.imageUrl || 'https://picsum.photos/200',
        lastSeen: Date.now(),
        notes: formData.notes || ''
      };
      setCats(prev => [newCat, ...prev]);
    } else if (view === 'EDIT' && selectedCatId) {
      setCats(prev => prev.map(c => c.id === selectedCatId ? { ...c, ...formData } as CatProfile : c));
    }
    goHome();
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这份档案吗？')) {
      setCats(prev => prev.filter(c => c.id !== id));
      goHome();
    }
  };

  const handleEditStart = () => {
    const cat = cats.find(c => c.id === selectedCatId);
    if (cat) {
      setFormData(cat);
      setView('EDIT');
    }
  };

  // Derived State
  const filteredCats = cats.filter(c => 
    c.name.includes(searchTerm) || 
    c.location.includes(searchTerm) ||
    c.breed.includes(searchTerm)
  );

  const selectedCat = cats.find(c => c.id === selectedCatId);

  // --- Views ---

  const renderHeader = (title: string, showBack = false) => (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 h-16 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={goHome} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}
        <h1 className="text-xl font-bold text-xmu-900 tracking-tight">{title}</h1>
      </div>
      <div className="w-8"></div>
    </header>
  );

  if (view === 'ADD_PHOTO') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <button onClick={goHome} className="absolute top-6 right-6 p-2 text-white/70 hover:text-white">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="w-full max-w-md text-center space-y-8">
          <div className="mx-auto w-24 h-24 bg-xmu-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.5)]">
            <CameraIcon className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3">识别流浪猫</h2>
            <p className="text-slate-400 text-lg">拍摄或上传照片，AI 将自动识别猫咪特征并建立档案。</p>
          </div>
          
          <label className="block w-full">
            <div className="w-full bg-white text-xmu-700 font-bold text-lg py-4 rounded-2xl shadow-lg cursor-pointer hover:bg-slate-100 transition flex items-center justify-center gap-2">
              <CameraIcon className="w-6 h-6" />
              <span>拍摄照片</span>
            </div>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoSelect} />
          </label>
          
          <label className="block w-full">
            <div className="w-full bg-transparent border-2 border-slate-600 text-slate-300 font-bold text-lg py-4 rounded-2xl cursor-pointer hover:bg-slate-800 transition flex items-center justify-center gap-2">
              <span className="text-2xl">🖼️</span>
              <span>从相册选择</span>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </label>
        </div>
      </div>
    );
  }

  if (view === 'ADD_DETAILS' || view === 'EDIT') {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        {renderHeader(view === 'EDIT' ? '编辑档案' : '登记新猫咪', true)}
        
        <div className="max-w-2xl mx-auto">
          {/* Image Preview Area */}
          <div className="relative h-64 bg-slate-200 w-full overflow-hidden">
            {formData.imageUrl ? (
              <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">无照片</div>
            )}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
                <div className="w-12 h-12 border-4 border-xmu-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="font-medium animate-pulse">AI 正在分析猫咪特征...</p>
              </div>
            )}
          </div>

          {analysisError && (
            <div className="m-4 p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
              {analysisError}
            </div>
          )}

          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">猫咪昵称 <span className="text-red-500">*</span></label>
                <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-xmu-500 focus:border-transparent outline-none bg-white" placeholder="例如：大白" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">出没地点 <span className="text-red-500">*</span></label>
                <div className="relative">
                    <MapPinIcon className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input required type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} 
                    className="w-full pl-10 p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-xmu-500 outline-none bg-white" placeholder="例如：芙蓉隧道" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                    <select value={formData.gender || Gender.UNKNOWN} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-xmu-500">
                        {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">状态</label>
                    <select value={formData.status || CatStatus.UNKNOWN} onChange={e => setFormData({...formData, status: e.target.value as CatStatus})}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-xmu-500">
                        {Object.values(CatStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-100 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <CatIcon className="w-4 h-4 text-xmu-500" /> AI 分析数据
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 uppercase">品种</label>
                        <input type="text" value={formData.breed || ''} onChange={e => setFormData({...formData, breed: e.target.value})} className="w-full mt-1 p-2 border-b border-slate-200 focus:border-xmu-500 outline-none bg-transparent text-slate-800" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase">花色</label>
                        <input type="text" value={formData.color || ''} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full mt-1 p-2 border-b border-slate-200 focus:border-xmu-500 outline-none bg-transparent text-slate-800" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase">预估年龄</label>
                        <input type="text" value={formData.estimatedAge || ''} onChange={e => setFormData({...formData, estimatedAge: e.target.value})} className="w-full mt-1 p-2 border-b border-slate-200 focus:border-xmu-500 outline-none bg-transparent text-slate-800" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase">特征描述</label>
                        <textarea value={formData.features || ''} onChange={e => setFormData({...formData, features: e.target.value})} rows={2} className="w-full mt-1 p-2 border-b border-slate-200 focus:border-xmu-500 outline-none bg-transparent text-slate-800 resize-none" />
                    </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注 / 健康记录</label>
                <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} 
                  rows={3} className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-xmu-500 outline-none bg-white" placeholder="更多关于这只猫的细节..." />
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" className="w-full bg-xmu-600 hover:bg-xmu-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-xmu-500/30 transition active:scale-[0.98]">
                保存档案
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'DETAIL' && selectedCat) {
    const statusColors = {
        [CatStatus.HEALTHY]: 'bg-green-100 text-green-700',
        [CatStatus.SICK]: 'bg-red-100 text-red-700',
        [CatStatus.INJURED]: 'bg-orange-100 text-orange-700',
        [CatStatus.ADOPTED]: 'bg-blue-100 text-blue-700',
        [CatStatus.MISSING]: 'bg-gray-200 text-gray-700',
        [CatStatus.UNKNOWN]: 'bg-slate-100 text-slate-600'
    };

    return (
      <div className="min-h-screen bg-white pb-6">
         {/* Hero Image */}
         <div className="relative h-80 w-full">
            <img src={selectedCat.imageUrl} alt={selectedCat.name} className="w-full h-full object-cover" />
            <button onClick={goHome} className="absolute top-4 left-4 bg-black/30 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/50 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/70 to-transparent"></div>
            <h1 className="absolute bottom-6 left-6 text-3xl font-bold text-white">{selectedCat.name}</h1>
         </div>

         <div className="px-6 -mt-6 relative z-10">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[selectedCat.status]}`}>
                        {selectedCat.status}
                    </span>
                    <div className="flex gap-2 text-sm text-slate-500">
                        <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {selectedCat.location}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">品种</p>
                        <p className="font-medium text-slate-800">{selectedCat.breed}</p>
                    </div>
                     <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">年龄</p>
                        <p className="font-medium text-slate-800">{selectedCat.estimatedAge}</p>
                    </div>
                     <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">性别</p>
                        <p className="font-medium text-slate-800">{selectedCat.gender}</p>
                    </div>
                     <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide">毛色</p>
                        <p className="font-medium text-slate-800">{selectedCat.color}</p>
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">外貌特征</p>
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedCat.features}</p>
                </div>

                <div className="mb-8">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">最近记录 / 备注</p>
                    <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{selectedCat.notes}</p>
                </div>

                <div className="flex gap-4">
                    <button onClick={handleEditStart} className="flex-1 bg-xmu-600 text-white py-3 rounded-xl font-medium hover:bg-xmu-700 transition flex items-center justify-center gap-2">
                        <EditIcon className="w-5 h-5" /> 编辑
                    </button>
                    <button onClick={() => handleDelete(selectedCat.id)} className="flex-1 bg-white border border-red-200 text-red-600 py-3 rounded-xl font-medium hover:bg-red-50 transition flex items-center justify-center gap-2">
                        <TrashIcon className="w-5 h-5" /> 删除
                    </button>
                </div>
            </div>
            
            <div className="mt-6 text-center text-xs text-slate-400">
                ID: {selectedCat.id} • Last Update: {new Date(selectedCat.lastSeen).toLocaleDateString()}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {renderHeader('XMUCat 厦大猫咪图鉴')}
      
      {/* Search */}
      <div className="px-4 py-2 sticky top-16 z-20 bg-slate-50/95 backdrop-blur">
        <div className="relative">
            <SearchIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
            <input 
                type="text" 
                placeholder="搜索猫咪昵称、地点或毛色..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-xmu-500 focus:border-xmu-500 outline-none"
            />
        </div>
      </div>

      {/* Content */}
      <main className="p-4">
        {filteredCats.length === 0 ? (
          <EmptyState onAdd={() => setView('ADD_PHOTO')} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCats.map(cat => (
              <div key={cat.id} onClick={() => goDetail(cat.id)} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition cursor-pointer group">
                <div className="relative h-48 overflow-hidden">
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <span className="text-white font-bold text-lg">{cat.name}</span>
                    </div>
                    {cat.status === CatStatus.SICK && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md">生病</div>
                    )}
                </div>
                <div className="p-3">
                    <div className="flex items-center text-slate-500 text-sm mb-2">
                        <MapPinIcon className="w-3.5 h-3.5 mr-1" /> {cat.location}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <span className="bg-xmu-50 text-xmu-700 text-xs px-2 py-1 rounded-md">{cat.breed}</span>
                        <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">{cat.estimatedAge}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-center justify-around py-3 px-2 z-40 safe-area-pb">
        <button onClick={goHome} className={`flex flex-col items-center p-2 rounded-xl transition ${view === 'HOME' ? 'text-xmu-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <HomeIcon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">首页</span>
        </button>
        
        <button onClick={() => setView('ADD_PHOTO')} className="flex flex-col items-center -mt-8">
            <div className="w-14 h-14 bg-xmu-600 rounded-full shadow-lg shadow-xmu-500/40 flex items-center justify-center text-white transition active:scale-95 active:bg-xmu-700 border-4 border-slate-50">
                <PlusIcon className="w-7 h-7" />
            </div>
            <span className="text-xs font-medium text-slate-600 mt-1">登记</span>
        </button>

        <button className="flex flex-col items-center p-2 text-slate-300 cursor-not-allowed">
            <div className="w-6 h-6 mb-1 rounded-full border-2 border-slate-300" />
            <span className="text-xs font-medium">我的</span>
        </button>
      </div>
    </div>
  );
}

export default App;
