export const formats={image:['JPG','PNG','WEBP','AVIF','HEIC','BMP','TIFF','SVG','ICO'],document:['PDF','DOCX','PPTX','TXT','HTML','MD','ODT'],video:['MP4','AVI','MOV','MKV','FLV','WEBM','GIF'],audio:['MP3','WAV','AAC','FLAC','OGG','M4A'],archive:['ZIP','RAR','TAR','GZIP','7Z'],ebook:['EPUB','PDF']}
const extensions=Object.fromEntries(Object.entries(formats).map(([category,values])=>[category,new Set(values.map(value=>value.toLowerCase()))]))
extensions.archive.add('gz')
extensions.document.add('markdown')
export function categoryOf(file){const mime=file.type||'';const ext=file.name.split('.').pop().toLowerCase();if(mime.startsWith('image/')||extensions.image.has(ext))return'image';if(mime.startsWith('video/')||extensions.video.has(ext))return'video';if(mime.startsWith('audio/')||extensions.audio.has(ext))return'audio';if(extensions.archive.has(ext))return'archive';if(ext==='epub'||ext==='mobi')return'ebook';return'document'}
export const prettyBytes=(n=0)=>{if(!n)return'0 B';const i=Math.floor(Math.log(n)/Math.log(1024));return`${(n/1024**i).toFixed(i?1:0)} ${['B','KB','MB','GB'][i]}`}
