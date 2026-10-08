<script lang="ts">
    let {
        id,
        label,
        type = "text",
        value = $bindable(""),
        placeholder = "",
        autocomplete,
        required = false,
        disabled = false,
        minlength,
        hint = ""
    } = $props<{
        id: string;
        label: string;
        type?: "text" | "email" | "password";
        value?: string;
        placeholder?: string;
        autocomplete?: string;
        required?: boolean;
        disabled?: boolean;
        minlength?: number;
        hint?: string;
    }>();
</script>

<div>
    <label for={id} class="mb-2 block text-sm font-medium text-gray-700">
        {label}
    </label>

    <input
        {id}
        {type}
        bind:value
        {placeholder}
        {autocomplete}
        {required}
        {disabled}
        {minlength}
        class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
    />

    {#if hint}
        <p class="mt-1.5 text-xs text-gray-400">{hint}</p>
    {/if}
</div>
