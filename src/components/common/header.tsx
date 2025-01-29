"use client"
import Link from "next/link";
import { Button } from "../ui/button";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();
    return (
        <div className="h-14 px-6 border-b">
            <div className="h-full flex justify-between items-center">
                <div className="">
                    <h1>Mango Classifier</h1>
                </div>
                <div className="flex gap-2">
                    <Link href="/">
                        <Button
                            variant={`${
                                pathname === "/" ? "default" : "ghost"
                            }`}
                        >
                            Home
                        </Button>
                    </Link>
                    <Link href="/result">
                        <Button
                            variant={`${
                                pathname === "/result" ? "default" : "ghost"
                            }`}
                        >
                            Result
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
