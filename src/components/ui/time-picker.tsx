import * as React from "react"
import { Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    value?: string
    onChange?: (time: string) => void
    className?: string
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
    const [open, setOpen] = React.useState(false)

    // Parse time string (HH:MM) to hours and minutes
    const parseTime = (val: string) => {
        const [h, m] = val.split(':').map(Number)
        return { h: h || 0, m: m || 0 }
    }

    const { h, m } = parseTime(value || "00:00")

    const hours = Array.from({ length: 24 }, (_, i) => i)
    const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

    const handleTimeChange = (newH: number, newM: number) => {
        const timeStr = `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`
        onChange?.(timeStr)
        // Don't close immediately to allow fine tuning? Or close for better UX?
        // Let's keep it open.
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal h-11 rounded-xl",
                        !value && "text-muted-foreground",
                        className
                    )}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    {value ? value : "Pick time"}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="flex gap-4">
                    <div className="flex flex-col gap-2 h-[200px] overflow-y-auto no-scrollbar">
                        <span className="text-xs font-medium text-center text-muted-foreground sticky top-0 bg-popover py-1">Hour</span>
                        {hours.map((hour) => (
                            <Button
                                key={hour}
                                variant={h === hour ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleTimeChange(hour, m)}
                                className="w-12 shrink-0"
                            >
                                {hour.toString().padStart(2, '0')}
                            </Button>
                        ))}
                    </div>
                    <div className="w-[1px] bg-border" />
                    <div className="flex flex-col gap-2 h-[200px] overflow-y-auto no-scrollbar">
                        <span className="text-xs font-medium text-center text-muted-foreground sticky top-0 bg-popover py-1">Min</span>
                        {minutes.map((minute) => (
                            <Button
                                key={minute}
                                variant={m === minute ? "default" : "ghost"}
                                size="sm"
                                onClick={() => handleTimeChange(h, minute)}
                                className="w-12 shrink-0"
                            >
                                {minute.toString().padStart(2, '0')}
                            </Button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
