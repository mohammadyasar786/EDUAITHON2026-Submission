import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  topic: string;
  module: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MODULES = ["Arrays", "Stacks", "Queues"];
const TIME_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"
];

interface StudentTimetableProps {
  userId?: string;
}

const StudentTimetable = ({ userId }: StudentTimetableProps) => {
  const [timetable, setTimetable] = useState<TimeSlot[]>([]);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [newSlot, setNewSlot] = useState<Partial<TimeSlot>>({
    day: "Monday",
    startTime: "09:00",
    endTime: "10:00",
    topic: "",
    module: "Arrays"
  });

  // Load timetable from localStorage
  useEffect(() => {
    const savedTimetable = localStorage.getItem(`timetable_${userId || "guest"}`);
    if (savedTimetable) {
      setTimetable(JSON.parse(savedTimetable));
    }
  }, [userId]);

  // Save timetable to localStorage
  const saveTimetable = (slots: TimeSlot[]) => {
    localStorage.setItem(`timetable_${userId || "guest"}`, JSON.stringify(slots));
    setTimetable(slots);
  };

  const handleAddSlot = () => {
    if (!newSlot.topic) {
      toast.error("Please enter a topic name");
      return;
    }

    const slot: TimeSlot = {
      id: Date.now().toString(),
      day: newSlot.day || "Monday",
      startTime: newSlot.startTime || "09:00",
      endTime: newSlot.endTime || "10:00",
      topic: newSlot.topic,
      module: newSlot.module || "Arrays"
    };

    saveTimetable([...timetable, slot]);
    setNewSlot({ day: "Monday", startTime: "09:00", endTime: "10:00", topic: "", module: "Arrays" });
    setIsAddingSlot(false);
    toast.success("Study slot added!");
  };

  const handleDeleteSlot = (id: string) => {
    saveTimetable(timetable.filter(slot => slot.id !== id));
    toast.info("Slot removed");
  };

  const handleUpdateSlot = (id: string, updates: Partial<TimeSlot>) => {
    saveTimetable(timetable.map(slot => 
      slot.id === id ? { ...slot, ...updates } : slot
    ));
    setEditingSlotId(null);
    toast.success("Slot updated!");
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case "Arrays":
        return "bg-primary/10 text-primary border-primary/20";
      case "Stacks":
        return "bg-success/10 text-success border-success/20";
      case "Queues":
        return "bg-info/10 text-info border-info/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const groupedByDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter(slot => slot.day === day).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <Card className="border-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            My Study Timetable
          </CardTitle>
          {!isAddingSlot && (
            <Button size="sm" onClick={() => setIsAddingSlot(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Slot
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Slot Form */}
        {isAddingSlot && (
          <Card className="p-4 border-dashed border-2 border-primary/30 bg-primary/5">
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Add Study Slot</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Select
                  value={newSlot.day}
                  onValueChange={(value) => setNewSlot({ ...newSlot, day: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Day" />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newSlot.startTime}
                  onValueChange={(value) => setNewSlot({ ...newSlot, startTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Start" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newSlot.endTime}
                  onValueChange={(value) => setNewSlot({ ...newSlot, endTime: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="End" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={newSlot.module}
                  onValueChange={(value) => setNewSlot({ ...newSlot, module: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODULES.map(module => (
                      <SelectItem key={module} value={module}>{module}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Topic (e.g., Array traversal, Stack operations)"
                value={newSlot.topic}
                onChange={(e) => setNewSlot({ ...newSlot, topic: e.target.value })}
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsAddingSlot(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSlot}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Slot
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Timetable Display */}
        {timetable.length === 0 && !isAddingSlot ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No study slots scheduled yet</p>
            <p className="text-sm">Click "Add Slot" to create your study timetable</p>
          </div>
        ) : (
          <div className="space-y-3">
            {DAYS.map(day => {
              const slots = groupedByDay[day];
              if (slots.length === 0) return null;

              return (
                <div key={day} className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">{day}</h4>
                  <div className="space-y-2">
                    {slots.map(slot => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          <Badge className={getModuleColor(slot.module)}>
                            {slot.module}
                          </Badge>
                          <span className="font-medium text-sm">{slot.topic}</span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingSlotId(slot.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteSlot(slot.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentTimetable;
