/**
 * Public Shoppable Gallery Page
 * Accessible at /g/{workspace}/{slug}
 */

import { notFound } from 'next/navigation';
import { prisma } from '@ugc/database';
import { formatCurrency } from '@ugc/shared';
import { Metadata } from 'next';

interface PageProps {
  params: { workspace: string; pageSlug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspace },
    select: { name: true },
  });

  const page = await prisma.shoppablePage.findFirst({
    where: { 
      workspace: { slug: params.workspace },
      slug: params.pageSlug,
      isPublic: true,
    },
    select: { title: true, description: true },
  });

  if (!page || !workspace) {
    return { title: 'Page Not Found' };
  }

  return {
    title: `${page.title} | ${workspace.name}`,
    description: page.description || `Shop ${page.title} from ${workspace.name}`,
  };
}

export default async function PublicGalleryPage({ params }: PageProps) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug: params.workspace },
    select: { id: true, name: true, logoUrl: true },
  });

  if (!workspace) {
    notFound();
  }

  const page = await prisma.shoppablePage.findFirst({
    where: {
      workspaceId: workspace.id,
      slug: params.pageSlug,
      isPublic: true,
    },
    include: {
      campaign: { select: { utmSource: true, utmMedium: true, utmCampaign: true } },
      items: {
        include: {
          repurposedClip: {
            include: {
              sourceMediaAsset: {
                include: {
                  ugcPost: { 
                    select: { 
                      creatorHandle: true, 
                      platform: true,
                      caption: true,
                    } 
                  },
                },
              },
              contentProductMaps: {
                include: { 
                  product: {
                    select: {
                      id: true,
                      title: true,
                      price: true,
                      currency: true,
                      imageUrl: true,
                      url: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
  });

  if (!page) {
    notFound();
  }

  const theme = (page.themeJson as Record<string, string>) || {};
  const primaryColor = theme.primaryColor || '#7c3aed';
  const backgroundColor = theme.backgroundColor || '#ffffff';

  // Build UTM params from campaign
  const utmParams = new URLSearchParams();
  if (page.campaign?.utmSource) utmParams.set('utm_source', page.campaign.utmSource);
  if (page.campaign?.utmMedium) utmParams.set('utm_medium', page.campaign.utmMedium);
  if (page.campaign?.utmCampaign) utmParams.set('utm_campaign', page.campaign.utmCampaign);
  const utmString = utmParams.toString();

  return (
    <div className="min-h-screen" style={{ backgroundColor }}>
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workspace.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={workspace.logoUrl} 
                alt={workspace.name} 
                className="w-8 h-8 rounded"
              />
            ) : (
              <div 
                className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: primaryColor }}
              >
                {workspace.name.charAt(0)}
              </div>
            )}
            <span className="font-semibold">{workspace.name}</span>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{page.title}</h1>
          {page.description && (
            <p className="text-gray-600 max-w-2xl mx-auto">{page.description}</p>
          )}
        </div>

        {/* Content Grid */}
        {page.items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            No content available yet
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {page.items.map((item) => {
              const clip = item.repurposedClip;
              const ugcPost = clip.sourceMediaAsset?.ugcPost;
              const products = clip.contentProductMaps.map(m => m.product);

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Video Thumbnail */}
                  <div className="aspect-[9/16] bg-gray-100 relative">
                    {clip.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={clip.thumbnailUrl} 
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400">Video</span>
                      </div>
                    )}
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-800 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Creator Info */}
                  {ugcPost && (
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {ugcPost.creatorHandle.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">@{ugcPost.creatorHandle}</p>
                          <p className="text-xs text-gray-500">{ugcPost.platform}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tagged Products */}
                  {products.length > 0 && (
                    <div className="p-4">
                      <p className="text-xs font-medium text-gray-500 mb-3">SHOP THIS LOOK</p>
                      <div className="space-y-3">
                        {products.map((product) => {
                          const productUrl = utmString 
                            ? `${product.url}${product.url.includes('?') ? '&' : '?'}${utmString}`
                            : product.url;

                          return (
                            <a
                              key={product.id}
                              href={productUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img 
                                  src={product.imageUrl} 
                                  alt={product.title}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-200 rounded" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{product.title}</p>
                                {product.price && (
                                  <p className="text-sm" style={{ color: primaryColor }}>
                                    {formatCurrency(Number(product.price), product.currency)}
                                  </p>
                                )}
                              </div>
                              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 text-center text-sm text-gray-500">
        <p>Powered by UGC Commerce Engine</p>
      </footer>
    </div>
  );
}
