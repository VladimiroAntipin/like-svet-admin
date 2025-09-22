'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlusIcon, Trash } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface ImageField {
    id: string;
    url: string;
}

interface ImageUploadProps {
    disabled?: boolean;
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    value: ImageField[];
    move: (from: number, to: number) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ disabled, onChange, onRemove, value, move }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => setIsMounted(true), []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpload = (result: any) => {
        const url = result?.info?.secure_url as string | undefined;
        if (url) onChange(url);
    };

    if (!isMounted) return null;

    const moveUp = (index: number) => {
        if (index === 0) return;
        move(index, index - 1);
    };

    const moveDown = (index: number) => {
        if (index === value.length - 1) return;
        move(index, index + 1);
    };

    return (
        <div>
            <div className="mb-4 flex items-center gap-4 flex-wrap">
                {value.map((field, index) => (
                    <div key={field.id} className="relative w-[200px] h-[200px] rounded-md overflow-hidden max-[500px]:w-[100px] max-[500px]:h-[100px]">
                        <div className="z-10 absolute top-2 right-2 flex gap-1">
                            <Button type="button" onClick={() => onRemove(field.url)} variant="destructive" size="sm">
                                <Trash className="h-4 w-4" />
                            </Button>
                            <Button type="button" size="sm" onClick={() => moveUp(index)}>↑</Button>
                            <Button type="button" size="sm" onClick={() => moveDown(index)}>↓</Button>
                        </div>
                        <Image fill className="object-cover" alt="image" src={field.url} sizes="(max-width: 500px) 100px, 200px" />
                    </div>
                ))}
            </div>

            <CldUploadWidget onSuccess={handleUpload} uploadPreset="cmnontpg" options={{ multiple: true }}>
                {({ open }) => (
                    <Button type="button" disabled={disabled} variant="secondary" onClick={() => open()}>
                        <ImagePlusIcon className="w-4 h-4 mr-2" />
                        Добавить фото
                    </Button>
                )}
            </CldUploadWidget>
        </div>
    );
};

export default ImageUpload;