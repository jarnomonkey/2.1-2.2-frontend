<script lang="ts">
    type Option = {
        value: string;
        label: string;
    };

    let {
        id,
        label,
        value = $bindable(""),
        options,
        required = false,
        disabled = false,
        error = ""
    } = $props<{
        id: string;
        label: string;
        value?: string;
        options: Option[];
        required?: boolean;
        disabled?: boolean;
        error?: string;
    }>();
</script>

<div>
    <label for={id} class="mb-2 block text-sm font-medium text-gray-700">
        {label}
    </label>

    <select
        {id}
        bind:value
        {required}
        {disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
        {#each options as option}
            <option value={option.value}>{option.label}</option>
        {/each}
    </select>

    {#if error}
        <p id={`${id}-error`} role="alert" class="mt-1.5 text-sm text-red-700">
            {error}
        </p>
    {/if}
</div>
