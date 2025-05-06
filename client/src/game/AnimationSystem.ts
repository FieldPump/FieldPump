// FieldPump Animation System

import { SpriteManager } from './SpriteManager';

export interface AnimationFrame {
  spriteId: string;
  duration: number; // Duration in milliseconds
}

export interface Animation {
  id: string;
  frames: AnimationFrame[];
  loop: boolean;
}

export class AnimationSystem {
  private animations: Map<string, Animation> = new Map();
  private currentAnimations: Map<string, {
    animation: Animation;
    currentFrame: number;
    elapsed: number;
    onComplete?: () => void;
  }> = new Map();
  
  constructor(private spriteManager: SpriteManager) {
    this.initDefaultAnimations();
  }
  
  private initDefaultAnimations(): void {
    // Define default character animations
    
    // Warrior idle animation
    this.registerAnimation({
      id: 'warrior_idle',
      frames: [
        { spriteId: 'warrior_idle_1', duration: 500 },
        { spriteId: 'warrior_idle_2', duration: 500 }
      ],
      loop: true
    });
    
    // Warrior walk animations for each direction
    this.registerAnimation({
      id: 'warrior_walk_down',
      frames: [
        { spriteId: 'warrior_walk_down_1', duration: 200 },
        { spriteId: 'warrior_walk_down_2', duration: 200 },
        { spriteId: 'warrior_walk_down_3', duration: 200 },
        { spriteId: 'warrior_walk_down_4', duration: 200 }
      ],
      loop: true
    });
    
    this.registerAnimation({
      id: 'warrior_walk_up',
      frames: [
        { spriteId: 'warrior_walk_up_1', duration: 200 },
        { spriteId: 'warrior_walk_up_2', duration: 200 },
        { spriteId: 'warrior_walk_up_3', duration: 200 },
        { spriteId: 'warrior_walk_up_4', duration: 200 }
      ],
      loop: true
    });
    
    this.registerAnimation({
      id: 'warrior_walk_left',
      frames: [
        { spriteId: 'warrior_walk_left_1', duration: 200 },
        { spriteId: 'warrior_walk_left_2', duration: 200 },
        { spriteId: 'warrior_walk_left_3', duration: 200 },
        { spriteId: 'warrior_walk_left_4', duration: 200 }
      ],
      loop: true
    });
    
    this.registerAnimation({
      id: 'warrior_walk_right',
      frames: [
        { spriteId: 'warrior_walk_right_1', duration: 200 },
        { spriteId: 'warrior_walk_right_2', duration: 200 },
        { spriteId: 'warrior_walk_right_3', duration: 200 },
        { spriteId: 'warrior_walk_right_4', duration: 200 }
      ],
      loop: true
    });
    
    // Similar animations for mage and archer classes
    // Mage idle
    this.registerAnimation({
      id: 'mage_idle',
      frames: [
        { spriteId: 'mage_idle_1', duration: 500 },
        { spriteId: 'mage_idle_2', duration: 500 }
      ],
      loop: true
    });
    
    // Archer idle
    this.registerAnimation({
      id: 'archer_idle',
      frames: [
        { spriteId: 'archer_idle_1', duration: 500 },
        { spriteId: 'archer_idle_2', duration: 500 }
      ],
      loop: true
    });
  }
  
  public registerAnimation(animation: Animation): void {
    this.animations.set(animation.id, animation);
  }
  
  public playAnimation(entityId: string, animationId: string, onComplete?: () => void): void {
    const animation = this.animations.get(animationId);
    
    if (!animation) {
      console.error(`Animation ${animationId} not found`);
      return;
    }
    
    this.currentAnimations.set(entityId, {
      animation,
      currentFrame: 0,
      elapsed: 0,
      onComplete
    });
  }
  
  public stopAnimation(entityId: string): void {
    this.currentAnimations.delete(entityId);
  }
  
  public update(deltaTime: number): void {
    // Update all active animations
    for (const [entityId, animState] of this.currentAnimations.entries()) {
      animState.elapsed += deltaTime * 1000; // Convert to milliseconds
      
      const currentFrame = animState.animation.frames[animState.currentFrame];
      
      if (animState.elapsed >= currentFrame.duration) {
        // Move to next frame
        animState.elapsed -= currentFrame.duration;
        animState.currentFrame++;
        
        // Check if animation is complete
        if (animState.currentFrame >= animState.animation.frames.length) {
          if (animState.animation.loop) {
            // Loop back to first frame
            animState.currentFrame = 0;
          } else {
            // Animation complete
            this.currentAnimations.delete(entityId);
            
            if (animState.onComplete) {
              animState.onComplete();
            }
            
            continue;
          }
        }
      }
    }
  }
  
  public getCurrentSprite(entityId: string): HTMLImageElement | null {
    const animState = this.currentAnimations.get(entityId);
    
    if (!animState) return null;
    
    const frame = animState.animation.frames[animState.currentFrame];
    return this.spriteManager.getSprite(frame.spriteId);
  }
  
  public getAnimationForMovement(characterClass: string, direction: string | null): string {
    if (!direction) {
      return `${characterClass}_idle`;
    }
    
    return `${characterClass}_walk_${direction}`;
  }
}