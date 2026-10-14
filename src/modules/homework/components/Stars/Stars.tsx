/** Ba ngôi sao kết quả bài (sao xám = chưa đạt) — thẻ ở danh sách bài + màn kết quả */
import clsx from 'clsx';
import Icon from '@/ui/Icon/Icon';
import styles from '@/modules/homework/components/Stars/Stars.module.scss';

export default function Stars({ count }: { count: number }) {
  return (
    <span className={styles.stars} aria-label={`${count} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Icon key={i} name="star" size={22} className={clsx(i >= count && styles.off)} />
      ))}
    </span>
  );
}
