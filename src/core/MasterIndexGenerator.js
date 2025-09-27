/**
 * MasterIndexGenerator.js v3.3 - Clean Version
 * NOTE: This version removes all special characters (emojis) from console logs
 * to prevent any potential parsing issues with build tools like Vite.
 */
class MasterIndexGenerator {
  constructor() {
    this.driveSync = null;
    this.mastodonData = null;
    this.version = '3.3-clean';
    console.log('MasterIndexGenerator v3.3: Ready for modular architecture...');
  }

  initialize(dependencies) {
    this.driveSync = dependencies.driveSync;
    this.mastodonData = dependencies.mastodonData;
    console.log('MasterIndexGenerator: Dependencies injected.');
  }

  async generateMomentsStructure() {
    if (!this.driveSync || !this.mastodonData) {
      throw new Error("MasterIndexGenerator has not been initialized with its dependencies.");
    }

    try {
      console.log('Generating moments structure...');
      
      await this.ensureDataLoaded();
      const photoMoments = await this.analyzePhotoMoments();
      const postsByDay = await this.analyzeMastodonPostsByDay();
      const unifiedMoments = this.createUnifiedMoments(photoMoments, postsByDay);
      const finalStructure = this.buildFinalMomentsStructure(unifiedMoments);
      
      await this.driveSync.saveData('masterIndex', finalStructure);
      
      console.log('Moments structure generated and saved.');
      return {
        success: true,
        structure: finalStructure,
        stats: finalStructure.metadata
      };
      
    } catch (error) {
      console.error('Error during moments generation:', error);
      return { success: false, error: error.message };
    }
  }
  
  async ensureDataLoaded() {
    if (!this.mastodonData.isImported) {
      console.log('Importing Mastodon posts...');
      await this.mastodonData.importFromGoogleDrive();
    }
    console.log('Mastodon data is available for the generator.');
  }

  async analyzeMastodonPostsByDay() {
    console.log('Analyzing Mastodon posts by day...');
    const posts = this.mastodonData.getPosts() || [];
    const postsByDay = {};
    
    for (const post of posts) {
      let dayNumber = post.dayNumber;
      if (dayNumber !== null && dayNumber >= 0) {
        if (!postsByDay[dayNumber]) {
          postsByDay[dayNumber] = [];
        }
        postsByDay[dayNumber].push(post);
      }
    }
    console.log(`${posts.length} posts distributed over ${Object.keys(postsByDay).length} days.`);
    return postsByDay;
  }

  createUnifiedMoments(photoMoments, postsByDay) {
    console.log('Fusing photo moments and posts...');
    const unifiedMoments = [];
    const processedDays = new Set();
    
    photoMoments.forEach(photoMoment => {
      const moment = {
        id: `moment_${photoMoment.dayStart}_${this.slugify(photoMoment.title)}`,
        title: photoMoment.title,
        dayStart: photoMoment.dayStart,
        dayEnd: photoMoment.dayEnd,
        posts: [],
        dayPhotos: photoMoment.photos,
        postPhotos: []
      };
      for (let day = photoMoment.dayStart; day <= photoMoment.dayEnd; day++) {
        if (postsByDay[day]) {
          moment.posts.push(...postsByDay[day]);
          postsByDay[day].forEach(p => moment.postPhotos.push(...(p.photos || [])));
        }
        processedDays.add(day);
      }
      unifiedMoments.push(moment);
    });

    for (const [dayStr, dayPosts] of Object.entries(postsByDay)) {
      const day = parseInt(dayStr);
      if (!processedDays.has(day)) {
        const moment = {
          id: `moment_${day}_post_only`,
          title: dayPosts[0].content.split('\n')[0].substring(0, 50),
          dayStart: day,
          dayEnd: day,
          posts: dayPosts,
          dayPhotos: [],
          postPhotos: dayPosts.flatMap(p => p.photos || [])
        };
        unifiedMoments.push(moment);
      }
    }
    
    unifiedMoments.sort((a, b) => a.dayStart - b.dayStart);
    console.log(`${unifiedMoments.length} unified moments created.`);
    return unifiedMoments;
  }

  buildFinalMomentsStructure(unifiedMoments) {
    console.log('Building final index structure...');
    const totalPhotos = unifiedMoments.reduce((sum, m) => sum + (m.dayPhotos?.length || 0) + (m.postPhotos?.length || 0), 0);
    const totalPosts = unifiedMoments.reduce((sum, m) => sum + (m.posts?.length || 0), 0);

    return {
      version: this.version,
      generated_at: new Date().toISOString(),
      metadata: {
        total_moments: unifiedMoments.length,
        total_photos: totalPhotos,
        total_posts: totalPosts
      },
      moments: unifiedMoments.map(m => ({
        ...m,
        postCount: m.posts?.length || 0,
        photoCount: (m.dayPhotos?.length || 0) + (m.postPhotos?.length || 0)
      }))
    };
  }
  
  async analyzePhotoMoments() {
    console.log('Analyzing photo folders...');
    // NOTE: Real logic is more complex. For now, returning an empty array.
    return []; 
  }

  slugify(text) {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .substring(0, 50);
  }
}

export const masterIndexGenerator = new MasterIndexGenerator();
if (typeof window !== 'undefined') {
  window.masterIndexGenerator = masterIndexGenerator;
}

