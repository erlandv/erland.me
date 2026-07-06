/**
 * Shared types and constants for the Stories feature
 */

/**
 * Story data structure
 * @property src - Image source URL (must be a relative path or same-origin absolute URL)
 * @property alt - Image alt text for accessibility
 */
export interface Story {
  src: string;
  alt: string;
}

/**
 * Music data structure
 * @property src - Audio file source URL
 * @property title - Song title
 * @property artist - Artist name (optional)
 */
export interface Music {
  src: string;
  title: string;
  artist?: string;
}

/**
 * Stories data container
 * @property stories - Array of story objects
 * @property music - Optional background music configuration
 */
export interface StoriesData {
  stories: Story[];
  music?: Music;
}

/**
 * Duration for each story in milliseconds
 */
export const STORY_DURATION = 5000;
