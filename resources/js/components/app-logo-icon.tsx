export default function AppLogoIcon({ className }: { className?: string }) {
    return (
        <img
            src="/images/sasho-dev-mark.png"
            alt=""
            className={`object-contain ${className ?? ''}`}
        />
    );
}
