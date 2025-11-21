import Header from '../../components/customer/Header'
import Footer from '../../components/customer/Footer'
import HeroSection from '../../components/customer/HeroSection'
import CategoriesSection from '../../components/customer/CategoriesSection'
import FeaturedProducts from '../../components/customer/FeaturedProducts'
import BenefitsSection from '../../components/customer/BenefitsSection'
import WhatsAppButton from '../../components/customer/WhatsAppButton'
import './StorePage.css'

export default function StorePage() {
    return (
        <div className="store-page">
            <Header />

            <main>
                <HeroSection />
                <CategoriesSection />
                <FeaturedProducts />
                <BenefitsSection />
            </main>

            <Footer />
            <WhatsAppButton />
        </div>
    )
}
