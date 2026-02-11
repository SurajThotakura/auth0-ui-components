import { cva, type VariantProps } from 'class-variance-authority';
import { defineComponent, h, type PropType, type VNode, type Component } from 'vue';

import { cn } from '../../lib/theme-utils';

/**
 * Button variant styles using class-variance-authority.
 * Mirrors the React implementation for consistent styling across frameworks.
 */
export const buttonVariants = cva(
  "focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive theme-default:active:scale-[0.99] relative box-border inline-flex shrink-0 items-center justify-center gap-2 overflow-hidden text-sm font-medium whitespace-nowrap transition-all duration-150 ease-in-out outline-none focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "shadow-button-resting hover:shadow-button-hover hover:border-primary/50 border-primary bg-primary text-primary-foreground hover:bg-primary/90 theme-default:before:from-primary-foreground/0 theme-default:before:to-primary-foreground/15 theme-default:before:absolute theme-default:before:top-0 theme-default:before:left-0 theme-default:before:block theme-default:before:h-full theme-default:before:w-full theme-default:before:bg-gradient-to-t theme-default:before:content-[''] border",
        outline:
          "dark:bg-muted/50 hover:text-accent-foreground shadow-button-outlined-resting hover:shadow-button-outlined-hover hover:border-accent bg-background hover:bg-muted text-primary border-primary/35 theme-default:before:from-primary/5 theme-default:before:to-primary/0 theme-default:before:absolute theme-default:before:top-0 theme-default:before:left-0 theme-default:before:block theme-default:before:h-full theme-default:before:w-full theme-default:before:bg-gradient-to-t theme-default:before:content-[''] border",
        ghost: 'hover:bg-muted text-primary bg-transparent',
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-button-destructive-resting hover:shadow-button-destructive-hover border-destructive-border/25 hover:border-destructive-border/50 theme-default:before:to-primary-foreground/50 theme-default:before:absolute theme-default:before:top-0 theme-default:before:left-0 theme-default:before:block theme-default:before:h-full theme-default:before:w-full theme-default:before:bg-gradient-to-t theme-default:before:content-[''] theme-default:border",
        link: 'text-foreground underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 rounded-2xl px-4 py-2.5 has-[>svg]:px-3',
        xs: 'h-7 rounded-md px-2 py-1.5 text-xs has-[>svg]:px-2',
        sm: 'h-8 gap-1.5 rounded-xl px-3 py-2 text-xs has-[>svg]:px-2.5',
        lg: 'h-12 rounded-3xl px-6 py-3 text-base has-[>svg]:px-4',
        icon: 'size-7 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

/**
 * Button props interface.
 */
export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  /** Render as a different element (slot pattern) */
  as?: boolean;
  /** Additional CSS classes */
  class?: string;
  /** Button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Button component for Vue 3.
 *
 * A versatile button component with multiple variants and sizes.
 * Mirrors the React implementation for consistent styling across frameworks.
 *
 * @example
 * ```vue
 * <template>
 *   <Button variant="primary" size="default" @click="handleClick">
 *     Click me
 *   </Button>
 *
 *   <Button variant="outline" size="sm">
 *     Small Outline
 *   </Button>
 *
 *   <Button variant="destructive" :disabled="isLoading">
 *     Delete
 *   </Button>
 * </template>
 *
 * <script setup lang="ts">
 * import { Button } from '@auth0/universal-components-vue';
 * </script>
 * ```
 */
export const Button = defineComponent({
  name: 'Button',
  props: {
    variant: {
      type: String as PropType<'primary' | 'outline' | 'ghost' | 'destructive' | 'link'>,
      default: 'primary',
    },
    size: {
      type: String as PropType<'default' | 'xs' | 'sm' | 'lg' | 'icon'>,
      default: 'default',
    },
    as: {
      type: Boolean,
      default: false,
    },
    class: {
      type: String,
      default: '',
    },
    type: {
      type: String as PropType<'button' | 'submit' | 'reset'>,
      default: 'button',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots, attrs }) {
    return () => {
      const className = cn(
        buttonVariants({ variant: props.variant, size: props.size }),
        props.class,
      );

      // If `as` is true, we render the slot content directly (similar to Radix Slot)
      // For now, we always render a button element
      // Full slot functionality would require additional implementation
      return h(
        'button',
        {
          ...attrs,
          class: className,
          type: props.type,
          disabled: props.disabled,
        },
        slots.default?.(),
      );
    };
  },
});
