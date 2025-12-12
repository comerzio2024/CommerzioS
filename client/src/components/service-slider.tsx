import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { ServiceCard } from "@/components/service-card";
import { ServiceWithDetails } from "@/lib/api";
import { useState, useEffect } from "react";

interface ServiceSliderProps {
    services: ServiceWithDetails[];
}

export function ServiceSlider({ services }: ServiceSliderProps) {
    const [api, setApi] = useState<CarouselApi>();
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        if (!api || isPaused) return;
        const interval = setInterval(() => {
            if (api.canScrollNext()) api.scrollNext();
            else api.scrollTo(0);
        }, 5000);
        return () => clearInterval(interval);
    }, [api, isPaused]);

    return (
        <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: true, duration: 30 }}
            className="w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            <CarouselContent>
                {services.map((s) => (
                    <CarouselItem key={(s as any).id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4 pl-4">
                        <div className="h-full p-2">
                            <ServiceCard service={s} />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
        </Carousel>
    );
}
