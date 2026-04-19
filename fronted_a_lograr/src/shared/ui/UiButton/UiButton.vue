<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[base, variantCls, sizeCls]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
type Variant = "primary" | "danger" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface Props {
  variant?: Variant;
  size?: Size;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  type: "button",
  disabled: false,
});

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

const variantMap: Record<Variant, string> = {
  primary: "bg-ink/65 hover:bg-ink/80 text-white",
  danger: "bg-accent hover:bg-accent text-black",
  ghost: "text-muted hover:text-black hover:bg-ghost",
  outline:
    "border border-border text-muted hover:text-black hover:border-ghost",
};

const sizeMap: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

const variantCls = variantMap[props.variant];
const sizeCls = sizeMap[props.size];
</script>
