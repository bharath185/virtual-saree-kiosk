import { useState, type FC } from 'react';
import {
  Sparkles,
  Palette,
  Shirt,
  Gem,
  Image as ImageIcon,
  Bookmark,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import type {
  SareeGarment,
  DrapingStyle,
  BlouseConfig,
  JewellerySet,
  OccasionScene,
  SleeveStyle,
  TryOnResult
} from '../../types/portal';
import {
  SAREE_PORTAL_CATALOG,
  DRAPING_STYLES,
  SLEEVE_DESIGNS,
  CONTRAST_BLOUSE_SWATCHES,
  JEWELLERY_SETS,
  OCCASION_SCENES
} from '../../data/portalCatalog';

export type CustomizerTab = 'saree' | 'blouse' | 'jewellery' | 'scene' | 'wishlist';

interface CoutureDrawerProps {
  selectedSaree: SareeGarment;
  onSelectSaree: (saree: SareeGarment) => void;
  selectedStyle: DrapingStyle;
  onSelectStyle: (style: DrapingStyle) => void;
  blouseConfig: BlouseConfig;
  onChangeBlouse: (config: BlouseConfig) => void;
  selectedJewellery: JewellerySet;
  onSelectJewellery: (jewellery: JewellerySet) => void;
  selectedScene: OccasionScene;
  onSelectScene: (scene: OccasionScene) => void;
  wishlist: TryOnResult[];
  onSelectSavedLook: (look: TryOnResult) => void;
}

export const CoutureDrawer: FC<CoutureDrawerProps> = ({
  selectedSaree,
  onSelectSaree,
  selectedStyle,
  onSelectStyle,
  blouseConfig,
  onChangeBlouse,
  selectedJewellery,
  onSelectJewellery,
  selectedScene,
  onSelectScene,
  wishlist,
  onSelectSavedLook
}) => {
  const [activeTab, setActiveTab] = useState<CustomizerTab>('saree');
  const [fabricFilter, setFabricFilter] = useState<string>('All');

  const fabrics = ['All', 'Banarasi', 'Kanjeevaram', 'Silk', 'Cotton', 'Georgette'];

  const filteredSarees = fabricFilter === 'All'
    ? SAREE_PORTAL_CATALOG
    : SAREE_PORTAL_CATALOG.filter((s) => s.fabric === fabricFilter);

  return (
    <div className="w-full h-full flex flex-col bg-neutral-950 border-l border-neutral-800 text-left overflow-hidden">
      {/* 1. TOP TAB NAVIGATION */}
      <div className="flex items-center border-b border-neutral-800 bg-neutral-900/60 p-1.5 overflow-x-auto no-scrollbar gap-1">
        <button
          onClick={() => setActiveTab('saree')}
          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'saree'
              ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Saree</span>
        </button>

        <button
          onClick={() => setActiveTab('blouse')}
          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'blouse'
              ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Shirt className="w-3.5 h-3.5" />
          <span>Blouse</span>
        </button>

        <button
          onClick={() => setActiveTab('jewellery')}
          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'jewellery'
              ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Gem className="w-3.5 h-3.5" />
          <span>Jewellery</span>
        </button>

        <button
          onClick={() => setActiveTab('scene')}
          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'scene'
              ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Scene</span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeTab === 'wishlist'
              ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved</span>
          {wishlist.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-mono">
              {wishlist.length}
            </span>
          )}
        </button>
      </div>

      {/* 2. TAB CONTENT PANELS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* ==================== TAB 1: SAREE & DRAPING STYLE ==================== */}
        {activeTab === 'saree' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Draping Style Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-serif uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  Draping Style (Front & Back)
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {selectedStyle.name}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {DRAPING_STYLES.map((style) => {
                  const isSelected = style.id === selectedStyle.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => onSelectStyle(style)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/10'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {style.name}
                        </span>
                        <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                          {style.region}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-snug">
                        {style.description}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400/80 mt-0.5">
                        <Info className="w-3 h-3 shrink-0" />
                        <span className="truncate">Pallu: {style.palluPlacement}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Saree Catalogue Section */}
            <div className="border-t border-neutral-800/80 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-serif uppercase tracking-wider text-amber-300 font-semibold">
                  Saree Collection
                </label>
                <span className="text-[10px] text-neutral-400">{filteredSarees.length} designs</span>
              </div>

              {/* Fabric Pill Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2">
                {fabrics.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFabricFilter(f)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors cursor-pointer shrink-0 ${
                      fabricFilter === f
                        ? 'bg-amber-400 text-neutral-950 font-bold'
                        : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Saree Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
                {filteredSarees.map((saree) => {
                  const isSelected = saree.id === selectedSaree.id;
                  return (
                    <button
                      key={saree.id}
                      onClick={() => onSelectSaree(saree)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-neutral-900 border-2 border-amber-400 shadow-lg shadow-amber-400/20'
                          : 'bg-neutral-900/50 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        {/* Swatch & Tag */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: saree.primaryColor }}
                            />
                            <div
                              className="w-3.5 h-3.5 rounded-full border border-white/20 -ml-2 shadow-sm"
                              style={{ backgroundColor: saree.secondaryColor }}
                            />
                          </div>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                            {saree.zariType}
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-white leading-tight">
                          {saree.name}
                        </h4>
                        <p className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                          {saree.fabric} · {saree.origin}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-800/60">
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {saree.price}
                        </span>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-amber-400 text-neutral-950 flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: BLOUSE STUDIO ==================== */}
        {activeTab === 'blouse' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Contrast Color Swatches */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-serif uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  Blouse Color Palette
                </label>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {blouseConfig.colorName}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CONTRAST_BLOUSE_SWATCHES.map((swatch) => {
                  const isSelected = blouseConfig.colorName === swatch.name;
                  return (
                    <button
                      key={swatch.name}
                      onClick={() =>
                        onChangeBlouse({
                          ...blouseConfig,
                          color: swatch.hex,
                          colorName: swatch.name,
                          isContrast: !swatch.isMatching
                        })
                      }
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-500/15'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-white/20 shadow-md relative flex items-center justify-center"
                        style={{
                          backgroundColor:
                            swatch.hex === 'inherit'
                              ? selectedSaree.primaryColor
                              : swatch.hex
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow" />}
                      </div>
                      <span className="text-[10px] text-center text-neutral-200 truncate w-full font-medium">
                        {swatch.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sleeve Design Selector */}
            <div className="border-t border-neutral-800/80 pt-4">
              <label className="text-xs font-serif uppercase tracking-wider text-amber-300 font-semibold block mb-2">
                Sleeve Cut & Styling
              </label>

              <div className="space-y-2">
                {SLEEVE_DESIGNS.map((sleeve) => {
                  const isSelected = blouseConfig.sleeveStyle === sleeve.id;
                  return (
                    <button
                      key={sleeve.id}
                      onClick={() =>
                        onChangeBlouse({
                          ...blouseConfig,
                          sleeveStyle: sleeve.id as SleeveStyle
                        })
                      }
                      className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-400'
                          : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-semibold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {sleeve.name}
                        </p>
                        <p className="text-[10px] text-neutral-400">{sleeve.description}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: JEWELLERY ATELIER ==================== */}
        {activeTab === 'jewellery' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-serif uppercase tracking-wider text-amber-300 font-semibold block mb-1">
                Curated Indian Jewellery Sets
              </label>
              <p className="text-[11px] text-neutral-400 mb-3">
                Select an authentic heritage set; each look dynamically adjusts necklaces, earrings, maang tikka, and bangles.
              </p>
            </div>

            <div className="space-y-2.5">
              {JEWELLERY_SETS.map((jewel) => {
                const isSelected = jewel.id === selectedJewellery.id;
                return (
                  <button
                    key={jewel.id}
                    onClick={() => onSelectJewellery(jewel)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-400/15'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: jewel.swatchColor }}
                        />
                        <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                          {jewel.name}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono text-neutral-400 uppercase">
                        {jewel.category}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-300 leading-snug">
                      {jewel.description}
                    </p>

                    {/* Pieces included tags */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {jewel.pieces.map((piece, i) => (
                        <span
                          key={i}
                          className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300"
                        >
                          {piece}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 4: OCCASION SCENE ==================== */}
        {activeTab === 'scene' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="text-xs font-serif uppercase tracking-wider text-amber-300 font-semibold block mb-1">
                Background & Relighting
              </label>
              <p className="text-[11px] text-neutral-400 mb-3">
                Keep the authentic background of your original photo or relight your look in an auspicious wedding or festival setting.
              </p>
            </div>

            <div className="space-y-2.5">
              {OCCASION_SCENES.map((scene) => {
                const isSelected = scene.id === selectedScene.id;
                return (
                  <button
                    key={scene.id}
                    onClick={() => onSelectScene(scene)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400 shadow-md shadow-amber-400/15'
                        : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                        {scene.name}
                      </span>
                      <span className="text-[9px] font-mono text-amber-400/90">
                        {scene.lightingTone}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-300">{scene.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 5: SAVED WISHLIST LOOKS ==================== */}
        {activeTab === 'wishlist' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <label className="text-xs font-serif uppercase tracking-wider text-amber-300 font-semibold">
                Saved Draped Looks
              </label>
              <span className="text-[10px] text-neutral-400">{wishlist.length} looks</span>
            </div>

            {wishlist.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-neutral-800 rounded-2xl text-neutral-500">
                <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-neutral-400">No saved looks yet</p>
                <p className="text-[10px] text-neutral-500 mt-0.5">
                  Tap the heart icon under any virtual drape to save it here for side-by-side comparison.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {wishlist.map((look) => (
                  <button
                    key={look.lookId}
                    onClick={() => onSelectSavedLook(look)}
                    className="w-full p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-400/50 text-left flex items-center gap-3 transition-all cursor-pointer"
                  >
                    <div className="w-14 h-16 rounded-lg overflow-hidden bg-neutral-950 shrink-0 border border-neutral-800">
                      <img src={look.frontUrl} alt={look.saree.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate">{look.saree.name}</p>
                      <p className="text-[10px] text-amber-300/80 font-mono">{look.drapingStyle.name}</p>
                      <p className="text-[9px] text-neutral-400 mt-0.5">{look.blouse.colorName} · {look.blouse.sleeveStyle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
