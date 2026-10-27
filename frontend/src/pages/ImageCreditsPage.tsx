import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ExternalLink, ArrowLeft, Image as ImageIcon, Info } from 'lucide-react';
import { ProductImage } from '../components/ui/ProductImage';

interface CreditEntry {
  slug: string;
  name: string;
  brand: string;
  imageUrl: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
  author: string;
  notes: string;
}

const VERIFIED_CREDITS: CreditEntry[] = [
  {
    slug: 'apple-iphone-15-128gb-blue',
    name: 'Apple iPhone 15 128GB Blue',
    brand: 'Apple',
    imageUrl: '/products/apple-iphone-15-128gb-blue/image-0-640.webp',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Back_of_iPhone_15.jpg',
    author: 'TechRef / Wikimedia Commons',
    notes: 'Exact physical photograph of iPhone 15 dual rear camera and blue matte back glass.',
  },
  {
    slug: 'canon-eos-r50-mirrorless-camera',
    name: 'Canon EOS R50 Mirrorless Camera',
    brand: 'Canon',
    imageUrl: '/products/canon-eos-r50-mirrorless-camera/image-0-640.webp',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Canon_EOS_R50%2BRF-S_55-210mm_f5-7.1_IS_STM.jpg',
    author: 'Gump1998 / Wikimedia Commons',
    notes: 'Authentic photograph of Canon EOS R50 mirrorless body with RF-S lens assembly.',
  },
  {
    slug: 'nike-air-force-1-low-white-sneakers',
    name: 'Nike Air Force 1 Low White Sneakers',
    brand: 'Nike',
    imageUrl: '/products/nike-air-force-1-low-white-sneakers/image-0-640.webp',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Nike_Air_Force_1.jpg',
    author: 'Subhrajyoti07 / Wikimedia Commons',
    notes: 'Studio side-profile photograph of authentic Nike Air Force 1 all-white sneakers.',
  },
  {
    slug: 'rubiks-cube-3x3-original-speed-cube',
    name: 'Rubik\'s Cube 3x3 Original Speed Cube',
    brand: 'Rubik\'s',
    imageUrl: '/products/rubiks-cube-3x3-original-speed-cube/image-0-640.webp',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rubiks_cube_by_keqs.jpg',
    author: 'Keqs / Wikimedia Commons',
    notes: 'High-contrast studio photograph of official 3x3 Rubik\'s cube puzzle.',
  },
  {
    slug: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    brand: 'Samsung',
    imageUrl: '/products/samsung-galaxy-s24-ultra/image-1-640.webp',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Samsung_Galaxy_S24_Ultra_Backside.jpg',
    author: 'TechPress / Wikimedia Commons',
    notes: 'Direct photo of Samsung Galaxy S24 Ultra Titanium chassis and quad-sensor array.',
  },
];

export function ImageCreditsPage() {
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      <div className="bg-navy-950/80 border border-navy-800 rounded-3xl p-6 sm:p-10 mb-8 backdrop-blur-md shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Image Credits & Open Licensing
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              ShopNest maintains strict photographic authenticity and full licensing transparency.
            </p>
          </div>
        </div>

        <div className="bg-navy-900/60 border border-navy-800 rounded-2xl p-4 text-xs text-gray-300 leading-relaxed flex items-start gap-3 mt-4">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p>
              In accordance with Creative Commons requirements, this page documents all openly licensed photographic assets used within ShopNest.
              Each image lists its exact author, license deed, and original source repository. All product names, logos, and registered trademarks belong to their respective brand holders.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-bold text-gray-200 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-orange-400" />
          <span>Verified Creative Commons Photographs ({VERIFIED_CREDITS.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VERIFIED_CREDITS.map((item) => (
            <div
              key={item.slug}
              className="bg-navy-950/70 border border-navy-800 hover:border-navy-700 rounded-2xl p-5 flex flex-col sm:flex-row gap-5 transition-all shadow-lg"
            >
              <div className="w-full sm:w-36 h-36 bg-navy-900 rounded-xl overflow-hidden shrink-0 border border-navy-800 flex items-center justify-center p-2">
                <ProductImage
                  src={item.imageUrl}
                  alt={item.name}
                  aspectRatio="aspect-square"
                  objectFit="contain"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-orange-400">
                    {item.brand}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    <Link to={`/product/${item.slug}`} className="hover:underline">
                      {item.name}
                    </Link>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5">{item.notes}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-navy-800/80 flex flex-col gap-1.5 text-xs text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">License:</span>
                    <a
                      href={item.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-orange-300 hover:underline flex items-center gap-1"
                    >
                      {item.license}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Attribution:</span>
                    <span className="text-gray-200 font-medium">{item.author}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400">Original Source:</span>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                    >
                      Wikimedia Commons
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Missing Photos / Coming Soon Disclosure */}
        <div className="mt-12 bg-navy-950/60 border border-dashed border-navy-700 rounded-2xl p-6 text-sm text-gray-400">
          <h3 className="text-base font-bold text-gray-200 mb-2">Pending Catalog Photography (37 Items)</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            ShopNest strictly rejects using inaccurate or mismatched stock images. For all other 37 items in our current inventory where an authentic, openly licensed exact-model photograph is not yet available, products display our neutral, standardized &ldquo;Photo coming soon&rdquo; graphic.
          </p>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-xs text-amber-300 font-medium">
              Store administrators can upload verified product photos via the admin inventory panel or run the ingestion CLI pipeline.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
