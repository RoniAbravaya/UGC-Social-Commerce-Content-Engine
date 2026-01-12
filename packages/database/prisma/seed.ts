/**
 * Database seed script
 * Creates demo data for development and testing
 */

import { PrismaClient, Platform, RightsStatus, ProductProvider, ClipFormat } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const passwordHash = await hash('Demo1234!', 12);
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@ugc-commerce.com' },
    update: {},
    create: {
      email: 'demo@ugc-commerce.com',
      name: 'Demo User',
      passwordHash,
      emailVerified: new Date(),
    },
  });
  console.log('✅ Created demo user:', demoUser.email);

  // Create demo workspace
  const demoWorkspace = await prisma.workspace.upsert({
    where: { slug: 'demo-brand' },
    update: {},
    create: {
      name: 'Demo Brand',
      slug: 'demo-brand',
      plan: 'STARTER',
      members: {
        create: {
          userId: demoUser.id,
          role: 'OWNER',
        },
      },
    },
  });
  console.log('✅ Created demo workspace:', demoWorkspace.name);

  // Create demo products
  const products = [
    {
      title: 'Classic White Sneakers',
      description: 'Premium leather sneakers with comfortable insole',
      price: 89.99,
      imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      url: 'https://example.com/products/white-sneakers',
      sku: 'SNK-001',
    },
    {
      title: 'Minimalist Watch',
      description: 'Elegant timepiece with genuine leather strap',
      price: 149.99,
      imageUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400',
      url: 'https://example.com/products/minimalist-watch',
      sku: 'WCH-002',
    },
    {
      title: 'Canvas Tote Bag',
      description: 'Durable canvas bag perfect for everyday use',
      price: 34.99,
      imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400',
      url: 'https://example.com/products/canvas-tote',
      sku: 'BAG-003',
    },
    {
      title: 'Wireless Earbuds',
      description: 'Premium sound quality with noise cancellation',
      price: 129.99,
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
      url: 'https://example.com/products/wireless-earbuds',
      sku: 'AUD-004',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: {
        workspaceId_provider_externalId: {
          workspaceId: demoWorkspace.id,
          provider: 'MANUAL',
          externalId: product.sku,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        provider: ProductProvider.MANUAL,
        externalId: product.sku,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: 'USD',
        imageUrl: product.imageUrl,
        url: product.url,
        sku: product.sku,
        inStock: true,
      },
    });
  }
  console.log(`✅ Created ${products.length} demo products`);

  // Create demo UGC posts
  const ugcPosts = [
    {
      platform: Platform.TIKTOK,
      postUrl: 'https://tiktok.com/@creator1/video/123456',
      creatorHandle: 'creator1',
      creatorName: 'Sarah Style',
      caption: 'Obsessed with these sneakers! 👟 #fashion #sneakers #ootd',
      hashtags: ['fashion', 'sneakers', 'ootd'],
      metricsJson: { views: 125000, likes: 8500, comments: 342, shares: 89 },
      postedAt: new Date('2024-01-15'),
    },
    {
      platform: Platform.INSTAGRAM,
      postUrl: 'https://instagram.com/p/abc123',
      creatorHandle: 'lifestyle_mike',
      creatorName: 'Mike Johnson',
      caption: 'New watch vibes ⌚ #watchesofinstagram #minimalist #style',
      hashtags: ['watchesofinstagram', 'minimalist', 'style'],
      metricsJson: { views: 45000, likes: 3200, comments: 156 },
      postedAt: new Date('2024-01-18'),
    },
    {
      platform: Platform.TIKTOK,
      postUrl: 'https://tiktok.com/@fashionista/video/789012',
      creatorHandle: 'fashionista',
      creatorName: 'Emma Fashion',
      caption: 'Perfect everyday bag! Love the quality 💕 #bags #fashion #haul',
      hashtags: ['bags', 'fashion', 'haul'],
      metricsJson: { views: 89000, likes: 5600, comments: 234, shares: 67 },
      postedAt: new Date('2024-01-20'),
    },
    {
      platform: Platform.TIKTOK,
      postUrl: 'https://tiktok.com/@tech_reviews/video/345678',
      creatorHandle: 'tech_reviews',
      creatorName: 'Tech Tom',
      caption: 'Best earbuds I\'ve tried! 🎧 Sound quality is insane #tech #earbuds #review',
      hashtags: ['tech', 'earbuds', 'review'],
      metricsJson: { views: 230000, likes: 15000, comments: 890, shares: 234 },
      postedAt: new Date('2024-01-22'),
    },
  ];

  const createdPosts = [];
  for (const post of ugcPosts) {
    const created = await prisma.ugcPost.upsert({
      where: {
        workspaceId_platform_postUrl: {
          workspaceId: demoWorkspace.id,
          platform: post.platform,
          postUrl: post.postUrl,
        },
      },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        platform: post.platform,
        postUrl: post.postUrl,
        creatorHandle: post.creatorHandle,
        creatorName: post.creatorName,
        caption: post.caption,
        hashtags: post.hashtags,
        metricsJson: post.metricsJson,
        postedAt: post.postedAt,
        importSource: 'seed',
      },
    });
    createdPosts.push(created);
  }
  console.log(`✅ Created ${ugcPosts.length} demo UGC posts`);

  // Create rights requests for some posts
  const rightsStatuses: RightsStatus[] = ['APPROVED', 'PENDING', 'REQUESTED', 'DENIED'];
  
  for (let i = 0; i < createdPosts.length; i++) {
    const status = rightsStatuses[i % rightsStatuses.length];
    
    await prisma.rightsRequest.upsert({
      where: { ugcPostId: createdPosts[i].id },
      update: {},
      create: {
        workspaceId: demoWorkspace.id,
        ugcPostId: createdPosts[i].id,
        status,
        requestMessage: `Hi! We love your content and would like to feature it on our channels. Reply YES to approve!`,
        requestMethod: 'dm',
        requestSentAt: status !== 'PENDING' ? new Date() : null,
        approvedAt: status === 'APPROVED' ? new Date() : null,
        deniedAt: status === 'DENIED' ? new Date() : null,
      },
    });
  }
  console.log(`✅ Created rights requests for demo posts`);

  // Create a demo campaign
  const campaign = await prisma.campaign.upsert({
    where: {
      id: 'demo-campaign-1',
    },
    update: {},
    create: {
      id: 'demo-campaign-1',
      workspaceId: demoWorkspace.id,
      name: 'Spring 2024 Collection',
      utmSource: 'ugc',
      utmMedium: 'social',
      utmCampaign: 'spring2024',
      isActive: true,
    },
  });
  console.log(`✅ Created demo campaign: ${campaign.name}`);

  // Create a demo shoppable page
  const shoppablePage = await prisma.shoppablePage.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: demoWorkspace.id,
        slug: 'spring-collection',
      },
    },
    update: {},
    create: {
      workspaceId: demoWorkspace.id,
      campaignId: campaign.id,
      slug: 'spring-collection',
      title: 'Spring 2024 Collection',
      description: 'Shop our latest styles as seen on your favorite creators',
      themeJson: {
        primaryColor: '#7c3aed',
        backgroundColor: '#ffffff',
        layout: 'grid',
      },
      isPublic: true,
      publishedAt: new Date(),
    },
  });
  console.log(`✅ Created demo shoppable page: ${shoppablePage.slug}`);

  console.log('');
  console.log('🎉 Seeding completed!');
  console.log('');
  console.log('Demo account credentials:');
  console.log('  Email: demo@ugc-commerce.com');
  console.log('  Password: Demo1234!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
