<script>
	import { enhance } from '$app/forms';
	import { useCompletion } from 'ai/svelte';
	import { Jumper } from 'svelte-loading-spinners';
	import { navigating } from '$app/stores';
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

	function startLoading() {
		loading = true;
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
	<form method="POST" action="?/chat" use:enhance enctype="multipart/form-data">
		<input type="hidden" name="text" value={ocr} />
		<input type="text" name="input" placeholder="Describe your business..." />
		<button type="submit">submit</button>
		{answer}
	</form>
{/if}

{#if loading}
	<Jumper size="60" color="#FF3E00" unit="px" duration="1s" />
{/if}
