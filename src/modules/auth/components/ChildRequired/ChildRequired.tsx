/**
 * Màn cần hồ sơ bé (bài tập về nhà…) mà chưa chọn bé: phụ huynh đã đăng nhập → nút chọn bé; khách → màn đăng nhập
 * phụ huynh tại chỗ.
 */
import { isFamilySignedIn, useAuth } from '@/modules/auth/stores/authStore';
import LoginScreen from '@/modules/auth/screens/LoginScreen/LoginScreen';
import { platformActions } from '@/core/navigation/platformStore';
import Button from '@/ui/Button/Button';
import { MASCOT } from '@/ui/icons';
import ScreenHeader from '@/ui/ScreenHeader/ScreenHeader';
import styles from '@/modules/auth/components/ChildRequired/ChildRequired.module.scss';

export default function ChildRequired({ title }: { title: string }) {
  const auth = useAuth();
  if (!isFamilySignedIn(auth)) return <LoginScreen />;
  return (
    <>
      <ScreenHeader title={title} backLabel="All games" onBack={() => platformActions.exitToHub()} />
      <div className={styles.card}>
        <img className={styles.mascot} src={MASCOT.hello} alt="" />
        <p className={styles.text}>Who is playing? Pick your child first.</p>
        <Button color="green" size="lg" onClick={() => platformActions.openAccount()}>
          PICK CHILD
        </Button>
      </div>
    </>
  );
}
