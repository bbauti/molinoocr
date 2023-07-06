<script>
	import FilePond, { registerPlugin, supported } from 'svelte-filepond';
	import FilePondPluginImageExifOrientation from 'filepond-plugin-image-exif-orientation';
	import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
	import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';

	import 'iconify-icon';

	import { page } from '$app/stores';

	import { enhance } from '$app/forms';
	import { SyncLoader } from 'svelte-loading-spinners';
	import { blur } from 'svelte/transition';
	import { fade } from 'svelte/transition';
	import { scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	import showdown from 'showdown';

	const converter = new showdown.Converter();

	registerPlugin(
		FilePondPluginImageExifOrientation,
		FilePondPluginImagePreview,
		FilePondPluginFileValidateType
	);

	export let pond;
	export let form;

	let ocr;
	let status;
	let loading;

	let uploadstatus;

	function startLoad() {
		loading = true;
		uploadstatus = 'uploading';
	}

	function startAnswerLoad() {
		loading = true;
	}

	function stopLoad() {
		loading = false;
		uploadstatus = 'done';
	}

	let visible;

	$: visible = false;

	let text = [];
	$: text = [];

	function res(response) {
		const parsed = JSON.parse(response);
		const data = JSON.parse(parsed.data);
		const statuspos = data[0].status;
		const textpos = data[0].text;
		text.push(data[textpos]);
		ocr = text.join(' <| TERMINACION DE CV |> ');
		status = data[statuspos];
	}

	$: ocr = text.join(' <| TERMINACION DE CV |> ');

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

	$: answer = form?.answer;

	let conversation = []

	// let test = {
	// 	"user": "Hola!",
	// 	"bot": "Hola! en que te puedo ayudar?"
	// }

	// conversation.push(test)
	// conversation.push(test)
	// conversation.push(test)

	// console.log(conversation)

	$: userinput = form?.userinput
	$: id = form?.id

	function addChat(bot, user) {
		let chat = {
			"user": user,
			"bot": bot
		}
		conversation.push(chat)
		conversation = conversation
	}

	$: if (form?.answer !== undefined) {
		stopLoad();
		addChat(answer, userinput)
		console.log(conversation)
	}

	// $: addChat(answer, userinput)


	uploadstatus = "done"

	// const directChat = async (query) => {
	// 	const formData = new FormData();
    // 	formData.append('value', query);
	// 	const response = await fetch('?/chat', {
	// 		method: 'POST',
	// 		body: formData
	// 	});
	// };

	async function directChat(query) {
		const formData = new FormData();
    	formData.append('value', query);
		const response = await fetch('?/chat', {
			method: 'POST',
			body: formData
		});
	}

	async function submit(query) {
		let form = document.getElementById("form")
        const data = new FormData(form);
		if (query) {
			data.append('value', query);
		}
        const response = await fetch(form.action, {
            method: 'POST',
            body: data
        });
    }

	ocr = "test"

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

	{#if uploadstatus === 'done'}
			<section id="user-input" transition:blur={{ delay: 250, duration: 300, easing: quintOut }}>
				<div class="answer">
					{#each conversation as chat, index}
						<div class="user">
							{chat.user}
						</div>
						<div class="bot">
							{#if index === conversation.length - 1}
								{chat.bot}
							{:else}
							<details>
								<summary class="botsummary">{chat.bot.slice(0,10)+"..."}</summary>
								{chat.bot}
							</details>
							{/if}
						</div>
					{/each}
				</div>
			</section>
		<section
			class="form userinput"
			transition:blur={{ delay: 250, duration: 300, easing: quintOut }}
		>
		<button on:click={() => submit("test")}></button>
			<form
				method="POST"
				action="?/chat"
				on:submit={startAnswerLoad}
				use:enhance
				id="form"
				enctype="multipart/form-data"
			>
				{#if id}
					<input type="hidden" name="id" value={id} />
				{/if}
				<input type="hidden" name="text" value={ocr} />
				<input type="text" name="input" placeholder="Ingresa tu pregunta" />
				<button type="submit"
					>Enviar<iconify-icon icon="mingcute:send-fill" style="font-size: 1.2rem;" /></button
				>
			</form>
		</section>
		<!-- {#if answer}
			<section transition:blur={{ delay: 250, duration: 300, easing: quintOut }}>
				<div class="answer">{@html converter.makeHtml(answer)}</div>
			</section>
		{/if} -->
	{/if}
	{#if loading}
		<section id="loading" transition:blur={{ delay: 250, duration: 300, easing: quintOut }}>
			<SyncLoader size="60" color="#d4d4d4" unit="px" duration="1s" />
		</section>
	{/if}
</main>

<style global>
	@import 'filepond/dist/filepond.css';
	@import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
	@import 'filepond.css';
</style>
