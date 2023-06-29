<script>
	import { enhance } from '$app/forms';
	export let form;
	if (form?.text === 'hey') {
	}
</script>

<form method="POST" action="?/submit" use:enhance enctype="multipart/form-data">
	<input name="file" type="file" accept="application/pdf" multiple />
	<button>Upload</button>
</form>
