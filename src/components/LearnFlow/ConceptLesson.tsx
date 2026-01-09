import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Volume2, CheckCircle2 } from "lucide-react";
import ConceptQuiz from "./ConceptQuiz";

interface ConceptLessonProps {
  concept: string;
  moduleName: string;
  onBack: () => void;
  onComplete: (concept: string) => void;
}

const conceptContent: Record<string, { title: string; content: string; examples: string[] }> = {
  // Introduction to Python
  "Variables": {
    title: "Variables in Python",
    content: "Variables are containers for storing data values. In Python, you don't need to declare the type of a variable - Python figures it out automatically. A variable is created the moment you first assign a value to it.",
    examples: [
      "name = 'Alice'  # String variable",
      "age = 25  # Integer variable",
      "height = 5.9  # Float variable",
      "is_student = True  # Boolean variable"
    ]
  },
  "Data Types": {
    title: "Data Types in Python",
    content: "Python has several built-in data types. The most common ones are strings (text), integers (whole numbers), floats (decimal numbers), and booleans (True/False). Understanding data types is crucial for writing effective Python code.",
    examples: [
      "text = 'Hello World'  # str",
      "number = 42  # int",
      "decimal = 3.14  # float",
      "flag = True  # bool",
      "items = [1, 2, 3]  # list"
    ]
  },
  "Operators": {
    title: "Operators in Python",
    content: "Operators are used to perform operations on variables and values. Python has arithmetic operators (+, -, *, /), comparison operators (==, !=, <, >), and logical operators (and, or, not).",
    examples: [
      "sum = 5 + 3  # Addition: 8",
      "diff = 10 - 4  # Subtraction: 6",
      "product = 6 * 7  # Multiplication: 42",
      "quotient = 15 / 3  # Division: 5.0",
      "is_equal = 5 == 5  # Comparison: True"
    ]
  },
  // Control Flow
  "If Statements": {
    title: "If Statements in Python",
    content: "If statements allow you to execute code conditionally. You can use if, elif (else if), and else to create complex decision trees in your programs.",
    examples: [
      "age = 18",
      "if age >= 18:",
      "    print('You are an adult')",
      "elif age >= 13:",
      "    print('You are a teenager')",
      "else:",
      "    print('You are a child')"
    ]
  },
  "Loops": {
    title: "Loops in Python",
    content: "Loops allow you to execute code repeatedly. Python has two main types of loops: for loops (iterate over a sequence) and while loops (repeat while a condition is true).",
    examples: [
      "# For loop",
      "for i in range(5):",
      "    print(i)  # Prints 0, 1, 2, 3, 4",
      "",
      "# While loop",
      "count = 0",
      "while count < 3:",
      "    print(count)",
      "    count += 1"
    ]
  },
  "Functions": {
    title: "Functions in Python",
    content: "Functions are reusable blocks of code that perform a specific task. You define a function using the 'def' keyword, and you can pass parameters and return values.",
    examples: [
      "def greet(name):",
      "    return f'Hello, {name}!'",
      "",
      "message = greet('Alice')",
      "print(message)  # Hello, Alice!"
    ]
  },
  // Data Structures
  "Lists": {
    title: "Lists in Python",
    content: "Lists are ordered, mutable collections that can hold multiple items. They are defined using square brackets and can contain items of different types.",
    examples: [
      "fruits = ['apple', 'banana', 'cherry']",
      "fruits.append('orange')  # Add item",
      "fruits[0]  # Access first item: 'apple'",
      "len(fruits)  # Get length: 4"
    ]
  },
  "Dictionaries": {
    title: "Dictionaries in Python",
    content: "Dictionaries store data in key-value pairs. They are unordered, mutable, and indexed by keys. Use curly braces to define a dictionary.",
    examples: [
      "person = {",
      "    'name': 'Alice',",
      "    'age': 25,",
      "    'city': 'New York'",
      "}",
      "person['name']  # Access: 'Alice'",
      "person['email'] = 'alice@example.com'  # Add"
    ]
  },
  "Sets": {
    title: "Sets in Python",
    content: "Sets are unordered collections of unique elements. They are useful for removing duplicates and performing mathematical set operations like union and intersection.",
    examples: [
      "colors = {'red', 'green', 'blue'}",
      "colors.add('yellow')  # Add item",
      "colors.add('red')  # No duplicate added",
      "'red' in colors  # Check membership: True"
    ]
  },
  // OOP
  "Classes": {
    title: "Classes in Python",
    content: "Classes are blueprints for creating objects. They encapsulate data (attributes) and behavior (methods) into a single entity. Use the 'class' keyword to define a class.",
    examples: [
      "class Dog:",
      "    def __init__(self, name):",
      "        self.name = name",
      "",
      "    def bark(self):",
      "        return f'{self.name} says Woof!'",
      "",
      "my_dog = Dog('Buddy')",
      "print(my_dog.bark())  # Buddy says Woof!"
    ]
  },
  "Inheritance": {
    title: "Inheritance in Python",
    content: "Inheritance allows a class to inherit attributes and methods from another class. The child class can extend or override the parent class's behavior.",
    examples: [
      "class Animal:",
      "    def speak(self):",
      "        return 'Some sound'",
      "",
      "class Cat(Animal):",
      "    def speak(self):",
      "        return 'Meow!'",
      "",
      "cat = Cat()",
      "print(cat.speak())  # Meow!"
    ]
  },
  "Polymorphism": {
    title: "Polymorphism in Python",
    content: "Polymorphism means 'many forms'. It allows different classes to be treated as instances of the same class through a common interface, enabling flexible and reusable code.",
    examples: [
      "class Bird:",
      "    def fly(self):",
      "        return 'Flying high!'",
      "",
      "class Penguin:",
      "    def fly(self):",
      "        return 'Cannot fly, but swim!'",
      "",
      "for animal in [Bird(), Penguin()]:",
      "    print(animal.fly())"
    ]
  }
};

const ConceptLesson = ({ concept, moduleName, onBack, onComplete }: ConceptLessonProps) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const lessonData = conceptContent[concept] || {
    title: concept,
    content: `Learn about ${concept} in this comprehensive lesson.`,
    examples: [`// Example code for ${concept}`]
  };

  const handleQuizComplete = (passed: boolean) => {
    if (passed) {
      setIsCompleted(true);
      onComplete(concept);
    }
    setShowQuiz(false);
  };

  if (showQuiz) {
    return (
      <ConceptQuiz
        concept={concept}
        moduleName={moduleName}
        onComplete={handleQuizComplete}
        onBack={() => setShowQuiz(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to {moduleName}
      </Button>

      <Card className="p-8 border-2 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">{lessonData.title}</h2>
          {isCompleted && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <p className="text-muted-foreground leading-relaxed text-lg">
            {lessonData.content}
          </p>
        </div>

        <div className="bg-muted/50 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-primary" />
            Code Examples
          </h3>
          <pre className="bg-background p-4 rounded-xl overflow-x-auto text-sm">
            <code className="text-foreground">
              {lessonData.examples.join('\n')}
            </code>
          </pre>
        </div>

        <div className="flex gap-4">
          <Button 
            className="flex-1 gradient-primary text-primary-foreground"
            onClick={() => setShowQuiz(true)}
          >
            Take Quiz to Complete
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConceptLesson;
