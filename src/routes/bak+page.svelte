<script>
	import { enhance } from '$app/forms';
	import { useCompletion } from 'ai/svelte';
	import { Jumper } from 'svelte-loading-spinners';
	import { blur } from 'svelte/transition';
	import { fade } from 'svelte/transition';
	import { scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	let ocr;
	let str;
	let status;

	let loading = false;

	export let form;

	$: if (form?.text !== undefined) {
		str = form?.text;
		loading = false;
		ocr = str.join(' <| TERMINACION DE CV |> ');
	}

	$: if (form?.status === 'done') {
		status = form?.status;
	}
	$: answer = form?.answer;
	$: console.log(form?.status);

	function startLoading() {
		loading = true;
	}

	let visible;

	$: visible = false;

	function test() {
		if (visible) {
			visible = false;
		} else {
			visible = true;
		}
	}
</script>

<form
	method="POST"
	action="?/submit"
	on:submit={startLoading}
	use:enhance
	enctype="multipart/form-data"
>
	<input name="file" type="file" accept=".png,.pdf" multiple required />
	<button>Upload</button>
</form>

{#if status === 'done'}
	<form transition:fade method="POST" action="?/chat" use:enhance enctype="multipart/form-data">
		<input type="hidden" name="text" value={ocr} />
		<input type="text" name="input" placeholder="Describe your business..." />
		<button type="submit">submit</button>
		{answer}
	</form>
{/if}

{#if loading}
	<Jumper size="60" color="#FF3E00" unit="px" duration="1s" />
{/if}

<button on:click={test}>ashe</button>

{#if visible}
	<form
		transition:blur={{ delay: 250, duration: 300, easing: quintOut }}
		method="POST"
		action="?/chat"
		use:enhance
		enctype="multipart/form-data"
	>
		<input type="hidden" name="text" value={ocr} />
		<input type="text" name="input" placeholder="Describe your business..." />
		<button type="submit">submit</button>
		{answer}
	</form>
{/if}
