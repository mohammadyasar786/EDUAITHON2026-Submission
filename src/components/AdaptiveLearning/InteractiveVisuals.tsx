import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowDown, Layers, List, CircleDot } from "lucide-react";

interface InteractiveVisualsProps {
  conceptId: string;
}

const InteractiveVisuals = ({ conceptId }: InteractiveVisualsProps) => {
  const renderArrayVisual = () => (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <List className="h-4 w-4 text-primary" />
        Array Structure
      </h4>
      
      {/* Visual Array Representation */}
      <div className="space-y-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {[10, 25, 37, 42, 58, 61, 79].map((val, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-14 h-14 flex items-center justify-center bg-primary text-primary-foreground font-bold rounded-lg shadow-sm">
                {val}
              </div>
              <span className="text-xs text-muted-foreground mt-1">
                [{idx}]
              </span>
            </div>
          ))}
        </div>
        
        {/* Key Points */}
        <div className="space-y-2 pt-3 border-t">
          <h5 className="text-sm font-medium">Key Concepts:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-primary shrink-0" />
              <span><strong>Index-based access:</strong> Access any element in O(1) using its index</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-primary shrink-0" />
              <span><strong>Contiguous memory:</strong> Elements stored sequentially in memory</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-primary shrink-0" />
              <span><strong>Fixed size:</strong> Size determined at creation (in most languages)</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );

  const renderStackVisual = () => (
    <Card className="p-6 bg-gradient-to-br from-success/5 to-success/10 border-success/20">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <Layers className="h-4 w-4 text-success" />
        Stack Structure (LIFO)
      </h4>
      
      {/* Visual Stack Representation */}
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          <Badge className="mb-2 bg-success/10 text-success border-success/20">
            Push / Pop ↕
          </Badge>
          <div className="flex flex-col gap-1">
            {["TOP → 79", "61", "42", "25", "10"].map((val, idx) => (
              <div 
                key={idx}
                className={`w-24 h-10 flex items-center justify-center font-medium rounded border-2 ${
                  idx === 0 
                    ? "bg-success text-success-foreground border-success" 
                    : "bg-muted/50 border-border"
                }`}
              >
                {val}
              </div>
            ))}
          </div>
          <ArrowDown className="h-5 w-5 text-muted-foreground mt-2" />
          <span className="text-xs text-muted-foreground">Bottom</span>
        </div>
        
        {/* Key Points */}
        <div className="flex-1 space-y-2">
          <h5 className="text-sm font-medium">Key Concepts:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-success shrink-0" />
              <span><strong>LIFO principle:</strong> Last In, First Out - newest item removed first</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-success shrink-0" />
              <span><strong>Push operation:</strong> Add element to top - O(1)</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-success shrink-0" />
              <span><strong>Pop operation:</strong> Remove element from top - O(1)</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-success shrink-0" />
              <span><strong>Use cases:</strong> Function calls, undo operations, expression evaluation</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );

  const renderQueueVisual = () => (
    <Card className="p-6 bg-gradient-to-br from-info/5 to-info/10 border-info/20">
      <h4 className="font-semibold mb-4 flex items-center gap-2">
        <ArrowRight className="h-4 w-4 text-info" />
        Queue Structure (FIFO)
      </h4>
      
      {/* Visual Queue Representation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <div className="flex flex-col items-center">
            <Badge className="mb-2 bg-info/10 text-info border-info/20 text-xs">
              Dequeue
            </Badge>
            <ArrowRight className="h-5 w-5 text-info" />
          </div>
          
          <div className="flex items-center gap-1">
            {[
              { val: 10, label: "FRONT" },
              { val: 25, label: "" },
              { val: 37, label: "" },
              { val: 42, label: "" },
              { val: 58, label: "REAR" }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-xs text-info font-medium h-4">
                  {item.label}
                </span>
                <div className={`w-12 h-12 flex items-center justify-center font-bold rounded-lg ${
                  idx === 0 || idx === 4
                    ? "bg-info text-info-foreground"
                    : "bg-muted/50 border-2 border-border"
                }`}>
                  {item.val}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex flex-col items-center">
            <Badge className="mb-2 bg-info/10 text-info border-info/20 text-xs">
              Enqueue
            </Badge>
            <ArrowRight className="h-5 w-5 text-info" />
          </div>
        </div>
        
        {/* Key Points */}
        <div className="space-y-2 pt-3 border-t">
          <h5 className="text-sm font-medium">Key Concepts:</h5>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-info shrink-0" />
              <span><strong>FIFO principle:</strong> First In, First Out - oldest item removed first</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-info shrink-0" />
              <span><strong>Enqueue:</strong> Add element at rear - O(1)</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-info shrink-0" />
              <span><strong>Dequeue:</strong> Remove element from front - O(1)</span>
            </li>
            <li className="flex items-start gap-2">
              <CircleDot className="h-3 w-3 mt-1 text-info shrink-0" />
              <span><strong>Use cases:</strong> BFS traversal, task scheduling, print spooling</span>
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );

  switch (conceptId) {
    case "arrays":
      return renderArrayVisual();
    case "stacks":
      return renderStackVisual();
    case "queues":
      return renderQueueVisual();
    default:
      return null;
  }
};

export default InteractiveVisuals;
