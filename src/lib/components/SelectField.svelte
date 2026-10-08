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
        disabled = false
    } = $props<{
        id: string;
        label: string;
        value?: string;
        options: Option[];
        required?: boolean;
        disabled?: boolean;
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
        class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-900 outline-none transition focus:border-black focus:bg-white focus:ring-2 focus:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
    >
        {#each options as option}
            <option value={option.value}>{option.label}</option>
        {/each}
    </select>
</div>
