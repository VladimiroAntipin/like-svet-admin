import Logo from '../../images/logo.jpg';
import Image from 'next/image';
import styles from './styles.module.css';

export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.authLayout}>
            <div className={styles.container}>
                <Image src={Logo} alt="Logo" className={styles.logo} />
                <div className={styles.divider} />
                {children}
            </div>

        </div>
    );
}