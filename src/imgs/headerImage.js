import usHeader from './event_header_us.jpg'
import ukHeader from './event_header_uk.jpg'
import caHeader from './event_header_ca.jpg'
import { getCountry } from '../api'

const HEADERS = { US: usHeader, UK: ukHeader, CA: caHeader }

export const getHeaderImage = () => HEADERS[getCountry()] || usHeader
