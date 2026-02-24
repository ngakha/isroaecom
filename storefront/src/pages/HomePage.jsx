import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RotateCcw, ChevronRight, Flame } from 'lucide-react';
import ProductCard from '../components/ecommerce/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroData, setHeroData] = useState({ slides: [], heroMode: 'carousel' });
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, saleRes, catRes, heroRes] = await Promise.all([
          api.get('/products', { params: { status: 'published', limit: 4, sortBy: 'created_at', sortOrder: 'asc' } }),
          api.get('/products', { params: { status: 'published', limit: 4, sortBy: 'created_at', sortOrder: 'desc' } }),
          api.get('/products', { params: { status: 'published', limit: 4, onSale: 'true' } }),
          api.get('/products/categories'),
          api.get('/heroes'),
        ]);
        setFeaturedProducts(featuredRes.data.data || []);
        setNewArrivals(newRes.data.data || []);
        setSaleProducts(saleRes.data.data || []);
        setCategories(catRes.data.data || []);
        setHeroData(heroRes.data.data || { slides: [], heroMode: 'carousel' });
      } catch {
        // Graceful fallback
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    if (heroData.heroMode !== 'carousel' || heroData.slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroData.slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroData]);

  const slides = heroData.slides || [];

  return (
    <div>
      {/* Hero Section: Categories (left) + Slides (right) */}
      <section className="bg-surface">
        <div className="max-w-container mx-auto px-4 lg:px-6 py-4 lg:py-6">
          <div className="flex gap-5">
            {/* Category Sidebar - desktop only */}
            {(loading || categories.length > 0) && (
              <div className="hidden lg:block w-64 flex-shrink-0">
                <nav className="bg-white rounded-xl border border-border shadow-sm h-full flex flex-col">
                  <div className="px-5 py-3.5 border-b border-border">
                    <h3 className="text-sm font-semibold text-primary-900 tracking-wide">{t('home.browseCategories')}</h3>
                  </div>
                  <div className="flex-1 py-1">
                    {loading ? (
                      Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="px-5 py-2.5">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                        </div>
                      ))
                    ) : categories.slice(0, 10).map((cat) => (
                      <div key={cat.id} className="relative group/cat">
                        <Link
                          to={`/shop?categoryId=${cat.id}`}
                          className="flex items-center justify-between px-5 py-2.5 text-[13px] text-primary-600 hover:bg-primary-50 hover:text-primary-900 hover:pl-6 transition-all"
                        >
                          <span>{cat.name}</span>
                          <ChevronRight size={14} className="text-primary-200 group-hover/cat:text-primary-500 transition-colors" />
                        </Link>
                        {cat.children?.length > 0 && (
                          <div className="absolute left-full top-0 hidden group-hover/cat:block z-30 pl-2">
                            <div className="bg-white rounded-xl border border-border shadow-xl py-2 w-52">
                              <div className="px-4 pb-1.5 mb-1 border-b border-border/50">
                                <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">{cat.name}</span>
                              </div>
                              {cat.children.map((sub) => (
                                <Link
                                  key={sub.id}
                                  to={`/shop?categoryId=${sub.id}`}
                                  className="block px-4 py-2 text-[13px] text-primary-600 hover:bg-primary-50 hover:text-primary-900 hover:pl-5 transition-all"
                                >
                                  {sub.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Link
                    to="/shop"
                    className="flex items-center justify-center gap-1.5 px-5 py-3 text-sm font-medium text-primary-900 bg-primary-50/60 hover:bg-primary-100 transition-colors rounded-b-xl border-t border-border mt-auto"
                  >
                    <span>{t('home.viewAll')}</span>
                    <ArrowRight size={14} />
                  </Link>
                </nav>
              </div>
            )}

            {/* Hero Slides */}
            <div className="flex-1 relative overflow-hidden rounded-xl min-h-[280px] sm:min-h-[360px] lg:min-h-[420px]">
              {loading ? (
                /* Skeleton while loading */
                <div className="absolute inset-0 bg-primary-100 animate-pulse rounded-xl" />
              ) : slides.length > 0 ? (
                <>
                  {slides.map((slide, idx) => (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-700 ${
                        idx === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      {slide.image_url ? (
                        <img
                          src={slide.image_url}
                          alt={slide.title || ''}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary-100" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

                      <div className="relative z-10 flex flex-col justify-center h-full px-8 lg:px-12 max-w-xl">
                        {slide.title && (
                          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight">
                            {slide.title}
                          </h1>
                        )}
                        {slide.subtitle && (
                          <p className="mt-3 text-sm sm:text-base text-white/80 leading-relaxed">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.button_text && slide.button_url && (
                          <div className="mt-6">
                            <Link
                              to={slide.button_url}
                              className="inline-flex items-center gap-2 bg-white text-primary-900 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-primary-50 transition-colors"
                            >
                              {slide.button_text}
                              <ArrowRight size={16} />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Dot indicators */}
                  {heroData.heroMode === 'carousel' && slides.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                      {slides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveSlide(idx)}
                          className={`h-2 rounded-full transition-all ${
                            idx === activeSlide
                              ? 'bg-white w-6'
                              : 'bg-white/40 w-2 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* Fallback: static hero when no slides configured */
                <div className="flex flex-col justify-center h-full bg-surface px-8 lg:px-12 py-16">
                  <h1 className="text-3xl lg:text-5xl font-semibold text-primary-900 tracking-tight leading-tight">
                    {t('home.heroDescription')}
                  </h1>
                  <p className="mt-4 text-base lg:text-lg text-primary-500 max-w-lg">
                    {t('home.heroSubtext')}
                  </p>
                  <div className="mt-8 flex items-center gap-4">
                    <Link
                      to="/shop"
                      className="inline-flex items-center gap-2 bg-primary-900 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                    >
                      {t('home.shopNow')}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-container mx-auto px-4 lg:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-primary-900">{t('home.featured')}</h2>
          <Link to="/shop" className="text-sm text-muted hover:text-primary-900 flex items-center gap-1 transition-colors">
            {t('home.viewAll')} <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </section>

      {/* Sale / Hot Deals */}
      {(loading || saleProducts.length > 0) && (
        <section className="relative overflow-hidden bg-gradient-to-br from-red-600 via-rose-600 to-orange-500">
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white" />
          </div>

          <div className="relative max-w-container mx-auto px-4 lg:px-6 py-14">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full">
                  <Flame size={22} className="text-yellow-200" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{t('home.hotDeals')}</h2>
                  <p className="text-sm text-white/70 mt-0.5">{t('home.hotDealsSubtitle')}</p>
                </div>
              </div>
              <Link
                to="/shop?onSale=true"
                className="hidden sm:inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors border border-white/20"
              >
                {t('home.viewAllDeals')} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : saleProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl p-2 shadow-lg shadow-black/10">
                      <ProductCard product={product} />
                    </div>
                  ))}
            </div>
            <Link
              to="/shop?onSale=true"
              className="sm:hidden flex items-center justify-center gap-2 mt-6 bg-white/15 backdrop-blur-sm text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-white/25 transition-colors border border-white/20"
            >
              {t('home.viewAllDeals')} <ArrowRight size={14} />
            </Link>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="bg-surface">
        <div className="max-w-container mx-auto px-4 lg:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-semibold text-primary-900">{t('home.newArrivals')}</h2>
            <Link to="/shop?sortBy=created_at&sortOrder=desc" className="text-sm text-muted hover:text-primary-900 flex items-center gap-1 transition-colors">
              {t('home.viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-container mx-auto px-4 lg:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-50 flex-shrink-0">
              <Truck size={20} className="text-primary-900" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">{t('home.freeShipping')}</h3>
              <p className="text-sm text-muted mt-0.5">{t('home.freeShippingDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-50 flex-shrink-0">
              <Shield size={20} className="text-primary-900" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">{t('home.securePayment')}</h3>
              <p className="text-sm text-muted mt-0.5">{t('home.securePaymentDesc')}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-50 flex-shrink-0">
              <RotateCcw size={20} className="text-primary-900" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-primary-900">{t('home.easyReturns')}</h3>
              <p className="text-sm text-muted mt-0.5">{t('home.easyReturnsDesc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
