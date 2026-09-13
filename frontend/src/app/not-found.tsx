import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h1 className="mb-2 text-6xl font-bold text-primary-600">404</h1>
      <p className="mb-6 text-gray-600">Страница не найдена. Возможно, она была удалена или вы ошиблись адресом.</p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white hover:bg-primary-700"
      >
        На главную
      </Link>
    </div>
  );
}