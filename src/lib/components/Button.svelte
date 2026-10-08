<script lang="ts">
    import type { Snippet } from "svelte";

    type Variant = "primary" | "secondary" | "danger";

    let {
        children,
        type = "button",
        variant = "primary" as Variant,
        disabled = false,
        fullWidth = false,
        class: className = "",
        onclick
    } = $props<{
        children: Snippet;
        type?: "button" | "submit" | "reset";
        variant?: Variant;
        disabled?: boolean;
        fullWidth?: boolean;
        class?: string;
        onclick?: (event: MouseEvent) => void;
    }>();

    const variants: Record<Variant, string> = {
        primary: "bg-black text-white hover:bg-gray-800",
        secondary: "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50"
    };
</script>

<button
    {type}
    {disabled}
    {onclick}
    class={`rounded-xl px-6 py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant as Variant]} ${fullWidth ? "w-full" : ""} ${className}`}
>
    {@render children()}
</button>
