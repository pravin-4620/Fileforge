import image from './imageConverter.js'
import media from './mediaConverter.js'
import document from './documentConverter.js'
import archive from './archiveConverter.js'
const plugins=[image,media,document,archive]
export function getConverter(category,from,to){const plugin=plugins.find(p=>(Array.isArray(p.category)?p.category.includes(category):p.category===category)&&p.canConvert(from,to));if(!plugin)throw Object.assign(new Error(`Conversion from ${from.toUpperCase()} to ${to.toUpperCase()} is not supported`),{status:422});return plugin}
export const capabilities=plugins.map(({category,supported})=>({category,supported}))
