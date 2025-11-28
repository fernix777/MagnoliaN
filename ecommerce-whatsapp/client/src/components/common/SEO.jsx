import { Helmet } from 'react-helmet-async'
import PropTypes from 'prop-types'

/**
 * SEO Component - Manages meta tags and structured data for individual pages
 * @param {Object} props - Component props
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {string} props.keywords - SEO keywords
 * @param {string} props.image - OG image URL
 * @param {string} props.url - Canonical URL
 * @param {string} props.type - OG type (website, article, product)
 * @param {Object} props.structuredData - Additional structured data
 */
export default function SEO({
    title = 'Magnolia Novedades - Decoración y Regalos Únicos',
    description = 'Descubre decoración única y regalos especiales en Magnolia Novedades. Ubicados en San Salvador de Jujuy, ofrecemos productos de calidad para hacer de cada momento algo especial.',
    keywords = 'decoración, regalos, novedades, San Salvador de Jujuy, Jujuy, Argentina',
    image = 'https://magnolia-novedades.vercel.app/logo.jpg',
    url = 'https://magnolia-novedades.vercel.app/',
    type = 'website',
    structuredData = null
}) {
    const fullTitle = title.includes('Magnolia') ? title : `${title} | Magnolia Novedades`

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Canonical URL */}
            <link rel="canonical" href={url} />

            {/* Open Graph */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:url" content={url} />
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content="Magnolia Novedades" />

            {/* Twitter Card */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    )
}

SEO.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    keywords: PropTypes.string,
    image: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
    structuredData: PropTypes.object
}
