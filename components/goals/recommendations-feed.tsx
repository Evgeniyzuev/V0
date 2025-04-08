import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

// Success stories data
const successStories = [
  {
    id: 1,
    name: 'David',
    avatar: 'https://randomuser.me/api/portraits/men/42.jpg',
    title: 'Career Pivot Success',
    story: "David, an accountant, dreamt of switching to game development but felt lost. The AI Assistant analyzed his skills, suggested targeted online courses, curated a portfolio-building plan, and flagged relevant entry-level job openings he wouldn't have found. After 8 months of guided effort, David landed his dream junior developer role and is now thrilled to work on projects he's passionate about.",
    image: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y29kZXxlbnwwfHwwfHx8MA%3D%3D',
    likes: 243,
    comments: 42,
    category: 'Career',
  },
  {
    id: 2,
    name: 'Priya',
    avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
    title: 'Entrepreneurial Launch',
    story: "Priya wanted to launch her sustainable crafts business for years but was overwhelmed by the process. The AI Assistant broke down the steps, helped her research target markets, identified ethical suppliers based on her criteria, generated a basic business plan framework, and even suggested initial marketing strategies. Her online store is now thriving, something she admits she couldn't have navigated alone.",
    image: 'https://images.unsplash.com/photo-1502035458144-454aa46b8ee0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGVudHJlcHJlbmV1cnxlbnwwfHwwfHx8MA%3D%3D',
    likes: 187,
    comments: 34,
    category: 'Business',
  },
  {
    id: 3,
    name: 'Leo',
    avatar: 'https://randomuser.me/api/portraits/men/24.jpg',
    title: 'Finding a Meaningful Relationship',
    story: "Leo struggled with dating apps and social anxiety, longing for a deep connection. The AI Assistant helped him articulate his values and relationship goals, suggested local social clubs aligned with his actual interests (not just dating venues), and offered personalized communication tips for low-pressure interactions. He met his current partner at a hiking group recommended by the AI, forming a bond he'd almost given up on.",
    image: 'https://images.unsplash.com/photo-1527960669566-f882ba85a4c6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8aGlraW5nJTIwY291cGxlfGVufDB8fDB8fHww',
    likes: 325,
    comments: 58,
    category: 'Relationships',
  },
  {
    id: 4,
    name: 'Chloe',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    title: 'Overcoming Creative Block',
    story: "Chloe dreamt of writing a novel but faced constant writer's block and disorganization. The AI Assistant helped her outline the plot using different narrative structures, set manageable daily writing goals with reminders, organized her research notes tagged by chapter, and even provided contextual writing prompts when she felt stuck. She finally finished her manuscript, feeling an immense sense of accomplishment.",
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fHdyaXRpbmd8ZW58MHx8MHx8fDA%3D',
    likes: 271,
    comments: 47,
    category: 'Creativity',
  },
  {
    id: 5,
    name: 'Kenji',
    avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
    title: 'Mastering a New Language',
    story: "Kenji wanted to become fluent in Spanish for travel but always abandoned his studies. The AI Assistant created a dynamic learning plan combining app lessons, news articles in Spanish related to his hobbies, and YouTube channels at his level. It scheduled short, consistent practice sessions and connected him with language exchange partners on the platform. He's now conversationally fluent and confidently planning his trip.",
    image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGxhbmd1YWdlJTIwbGVhcm5pbmd8ZW58MHx8MHx8fDA%3D',
    likes: 198,
    comments: 36,
    category: 'Learning',
  },
  {
    id: 6,
    name: 'Fatima',
    avatar: 'https://randomuser.me/api/portraits/women/67.jpg',
    title: 'Achieving Financial Freedom',
    story: "Fatima was burdened by debt and felt incapable of managing her finances. The AI Assistant analyzed her spending (with permission), created a personalized, achievable budget, devised a debt-repayment strategy she understood, flagged savings opportunities, and sent smart reminders for payments. Within 18 months, she became debt-free, a goal she previously found impossible.",
    image: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZmluYW5jZXxlbnwwfHwwfHx8MA%3D%3D',
    likes: 362,
    comments: 78,
    category: 'Finance',
  },
  {
    id: 7,
    name: 'Sarah',
    avatar: 'https://randomuser.me/api/portraits/women/22.jpg',
    title: 'Conquering Performance Anxiety',
    story: "Sarah, a talented musician, suffered from severe stage fright that prevented her from performing. The AI Assistant curated resources on Cognitive Behavioral Techniques (CBT), created a step-by-step plan for gradual exposure (from playing for the AI, to family, to small groups), and provided guided mindfulness exercises before practice sessions. She recently performed confidently at an open mic night, feeling liberated.",
    image: 'https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fG11c2ljaWFuJTIwcGVyZm9ybWluZ3xlbnwwfHwwfHx8MA%3D%3D',
    likes: 287,
    comments: 52,
    category: 'Performance',
  },
  {
    id: 8,
    name: 'Marcus',
    avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
    title: 'Improving Family Connections',
    story: "Marcus had a strained relationship with his teenage son and didn't know how to reconnect. Based on interests Marcus and his son (also a user, with consent) had logged, the AI suggested specific, low-pressure activities they might both enjoy (like a particular sci-fi movie marathon or a coding workshop). It also provided communication prompts focused on active listening. Their relationship has significantly improved.",
    image: 'https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8ZmF0aGVyJTIwYW5kJTIwc29ufGVufDB8fDB8fHww',
    likes: 342,
    comments: 67,
    category: 'Relationships',
  },
  {
    id: 9,
    name: 'Maria',
    avatar: 'https://randomuser.me/api/portraits/women/57.jpg',
    title: 'Completing a Fitness Endurance Challenge',
    story: "Maria dreamed of completing a half-marathon but past attempts failed due to injury or lost motivation. The AI Assistant designed a personalized training schedule that adapted based on her feedback (energy levels, aches), integrated rest days, suggested injury-prevention exercises, and provided daily motivational messages and progress tracking. She successfully completed the race, feeling stronger and prouder than ever.",
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fHJ1bm5pbmclMjByYWNlfGVufDB8fDB8fHww',
    likes: 412,
    comments: 83,
    category: 'Fitness',
  },
  {
    id: 10,
    name: 'Isabelle',
    avatar: 'https://randomuser.me/api/portraits/women/8.jpg',
    title: 'Launching a Community Initiative',
    story: "Isabelle wanted to start a neighborhood cleanup project but didn't know how to organize it or get volunteers. The AI Assistant helped her draft announcements, identified the best local online groups to post in, created a simple sign-up and scheduling tool, and even connected her with two other users on the platform in her area who shared similar environmental goals. The initiative was a success, making her neighborhood cleaner and fostering community spirit.",
    image: 'https://images.unsplash.com/photo-1618477202872-8e3490fb36ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGNvbW11bml0eSUyMGNsZWFudXB8ZW58MHx8MHx8fDA%3D',
    likes: 256,
    comments: 48,
    category: 'Community',
  }
];

// Example recommendation data remains as a fallback
const recommendations = [
  {
    id: 1,
    type: 'article',
    title: 'How to Set Achievable Goals',
    source: 'Goal Mastery Blog',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGdvYWxzfGVufDB8fDB8fHww',
    likes: 243,
    comments: 42,
  },
  {
    id: 2,
    type: 'video',
    title: 'The Science of Habit Formation',
    source: 'Mind Valley',
    image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGhhYml0c3xlbnwwfHwwfHx8MA%3D%3D',
    likes: 587,
    comments: 124,
  },
  {
    id: 3,
    type: 'podcast',
    title: 'Productivity Hacks for Busy Professionals',
    source: 'The Productivity Podcast',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHByb2R1Y3Rpdml0eXxlbnwwfHwwfHx8MA%3D%3D',
    likes: 362,
    comments: 78,
  },
];

const Feed: React.FC = () => {
  return (
    <div className="animate-fade-in pb-16">
      <div className="divide-y">
        {successStories.map((story) => (
          <Card key={story.id} className="border-none rounded-none shadow-none">
            <CardContent className="p-4">
              {/* Story Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={story.avatar} alt={story.name} />
                    <AvatarFallback>{story.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">{story.name}</p>
                    </div>
                    <div className="flex items-center mt-0.5">
                      <span className="text-xs bg-app-accent/10 text-app-accent px-2 py-0.5 rounded-full">
                        {story.category}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="text-gray-400">
                  <MoreHorizontal size={20} />
                </button>
              </div>
              
              {/* Story Title */}
              <h2 className="font-semibold text-lg mb-2">{story.title}</h2>
              
              {/* Story Image */}
              <div className="mb-3">
                <img 
                  src={story.image} 
                  alt={story.title} 
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>
              
              {/* Story Content */}
              <p className="text-gray-700 mb-4 text-sm">{story.story}</p>
              
              {/* Story Stats */}
              <div className="flex justify-between text-gray-500 text-sm">
                <div className="flex items-center">
                  <ThumbsUp size={16} className="mr-1" />
                  <span>{story.likes} likes</span>
                </div>
                <div className="flex items-center">
                  <MessageCircle size={16} className="mr-1" />
                  <span>{story.comments} comments</span>
                </div>
              </div>
              
              {/* Story Actions */}
              <div className="flex justify-around mt-3 pt-3 border-t">
                <button className="flex items-center text-gray-500 hover:text-app-accent">
                  <ThumbsUp size={18} className="mr-1" />
                  <span>Like</span>
                </button>
                <button className="flex items-center text-gray-500 hover:text-app-accent">
                  <MessageCircle size={18} className="mr-1" />
                  <span>Comment</span>
                </button>
                <button className="flex items-center text-gray-500 hover:text-app-accent">
                  <Share2 size={18} className="mr-1" />
                  <span>Share</span>
                </button>
                <button className="flex items-center text-gray-500 hover:text-app-accent">
                  <Bookmark size={18} className="mr-1" />
                  <span>Save</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Feed;
