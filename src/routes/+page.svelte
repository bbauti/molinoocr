<script>
	import FilePond, { registerPlugin, supported } from 'svelte-filepond';
	import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
	import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
	import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

	import 'iconify-icon';

	import { page } from '$app/stores';

	import { enhance } from '$app/forms';
	import { useCompletion } from 'ai/svelte';
	import { SyncLoader } from 'svelte-loading-spinners';
	import { blur } from 'svelte/transition';
	import { fade } from 'svelte/transition';
	import { scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	registerPlugin(
		FilePondPluginImageExifOrientation,
		FilePondPluginImagePreview,
		FilePondPluginFileValidateType
	);

	export let pond;

	let ocr;
	let str;
	let status;
	let loading;

	export let form;

	$: answer = form?.answer;

	function startLoad() {
		loading = true;
	}

	function stopLoad() {
		loading = false;
	}

	let visible;

	$: visible = false;

	let text = [];

	$: ocr = text.join(' <| TERMINACION DE CV |> ');

	function res(response) {
		const parsed = JSON.parse(response);
		const data = JSON.parse(parsed.data);
		const statuspos = data[0].status;
		const textpos = data[0].text;
		text.push(data[textpos]);
		status = data[statuspos];
	}

	let opc = {
		process: {
			url: '?/submit',
			method: 'POST',
			onload: (response) => res(response)
		}
	};

	let loaded = false;

	function hideLoad() {
		loaded = true;
	}
</script>

<main>
	<section class="app upload" style={loaded == false ? 'display:none;' : ''}>
		<FilePond
			bind:this={pond}
			allowFileTypeValidation={true}
			acceptedFileTypes={['image/png', 'application/pdf']}
			name="file"
			server={opc}
			allowMultiple={true}
			onaddfile={startLoad}
			onprocessfiles={stopLoad}
			oninit={hideLoad}
			credits={false}
			required={true}
			dropOnPage={true}
			labelIdle="Subi un archivo para comenzar"
			labelInvalidField="Contiene archivos invalidos"
			labelFileWaitingForSize="Esperando el tamaño"
			labelFileSizeNotAvailable="No se pudo recuperar el tamaño"
			labelFileLoading="Cargando"
			labelFileLoadError="Error"
			labelFileProcessing="Subiendo"
			labelFileProcessingComplete="Cargado"
			labelFileProcessingAborted="Cancelado"
			labelFileProcessingError="Error subiendose"
			labelFileRemoveError="Error removiendose"
			labelTapToCancel="Click para cancelar"
			labelTapToRetry="Click para reintentar"
			labelTapToUndo="Click para deshacer"
			labelButtonRemoveItem="Elimiar"
			labelButtonAbortItemLoad="Abortar"
			labelButtonRetryItemLoad="Reintentar"
			labelButtonAbortItemProcessing="Cancelar"
			labelButtonUndoItemProcessing="Deshacer"
			labelButtonRetryItemProcessing="Reintentar"
			labelButtonProcessItem="Subir"
		/>
	</section>
	{#if loading}
		<section id="loading" transition:blur={{ delay: 250, duration: 300, easing: quintOut }}>
			<SyncLoader size="60" color="#d4d4d4" unit="px" duration="1s" />
		</section>
	{/if}

	{#if status === 'done'}
		<section class="form userinput">
			<form
				transition:blur={{ delay: 250, duration: 300, easing: quintOut }}
				method="POST"
				action="?/chat"
				use:enhance
				enctype="multipart/form-data"
			>
				<input type="hidden" name="text" value={ocr} />
				<input type="text" name="input" placeholder="Ingresa tu pregunta" />
				<button type="submit"
					>submit<iconify-icon icon="mingcute:send-fill" style="font-size: 1.2rem;" /></button
				>
			</form>
		</section>
	{/if}
</main>

<style global>
	@import 'filepond/dist/filepond.css';
	@import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
	@import 'filepond.css';
</style>
