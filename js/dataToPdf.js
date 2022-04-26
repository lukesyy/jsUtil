function dataToPdf(pdfUrl, fields) {
	var xhr = new XMLHttpRequest()
	xhr.open('GET', pdfUrl, true)
	xhr.responseType = 'arraybuffer'
	xhr.onload = function () {
		if (this.status == 200) {
			var u = navigator.userAgent
			var isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1 //android终端
			var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/) //ios终端
			let buf = this.response
			let filled_pdf = pdfform().transform(buf, fields)
			var blob = new Blob([filled_pdf], { type: 'application/pdf' })
			var fileURL = URL.createObjectURL(blob)
			if(isAndroid) {  //android终端
				window.open(fileURL)
			}else if(isiOS) {   //ios终端
				window.location.href = fileURL
			}
		} else {
			console.error('failed to load URL (code: ' + this.status + ')')
		}
	}
	xhr.send()
}
