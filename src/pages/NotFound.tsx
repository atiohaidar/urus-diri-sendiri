import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { PenLine, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-notebook">
      <div className="text-center px-6">
        {/* 404 styled as grade in red pen */}
        <div className="w-28 h-28 mx-auto mb-6 rounded-full border-4 border-dashed border-doodle-red flex items-center justify-center -rotate-6">
          <span className="font-handwriting text-5xl text-doodle-red">404</span>
        </div>

        <h1 className="font-handwriting text-3xl text-ink mb-3">
          Halaman tidak ditemukan 📝
        </h1>

        <p className="font-handwriting text-lg text-pencil mb-8">
          Sepertinya halaman ini belum ditulis...
        </p>

        <Link to="/">
          <Button className="font-handwriting text-lg rounded-sm bg-doodle-primary hover:bg-doodle-primary/90 text-white shadow-notebook gap-2">
            <Home className="w-5 h-5" />
            Kembali ke Beranda
          </Button>
        </Link>

        {/* Decorative notebook doodles */}
        <div className="mt-12 flex justify-center gap-4 opacity-30">
          <PenLine className="w-6 h-6 text-pencil" />
          <span className="font-handwriting text-pencil">~</span>
          <PenLine className="w-6 h-6 text-pencil rotate-45" />
        </div>
      </div>
    </div>
  );
};

export default NotFound;
