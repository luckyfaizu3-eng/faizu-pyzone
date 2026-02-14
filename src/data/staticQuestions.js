// Static Python Mock Test Questions (20 questions for testing)
// TODO: Add 40 more questions later for full 60 questions

export const STATIC_QUESTIONS = [
  {
    id: 1,
    question: "What will be the output?",
    code: "x = 5\ny = 3\nprint(x + y)",
    options: ["53", "8", "Error", "None"],
    correct: 1
  },
  {
    id: 2,
    question: "What is the correct output?",
    code: "print(type([1, 2, 3]))",
    options: ["<class 'tuple'>", "<class 'list'>", "<class 'set'>", "<class 'dict'>"],
    correct: 1
  },
  {
    id: 3,
    question: "What will this print?",
    code: "name = 'Python'\nprint(name[0])",
    options: ["P", "y", "Python", "Error"],
    correct: 0
  },
  {
    id: 4,
    question: "What is the output?",
    code: "x = 10\nif x > 5:\n    print('Yes')\nelse:\n    print('No')",
    options: ["Yes", "No", "Error", "Nothing"],
    correct: 0
  },
  {
    id: 5,
    question: "What will be printed?",
    code: "nums = [1, 2, 3, 4, 5]\nprint(len(nums))",
    options: ["4", "5", "6", "Error"],
    correct: 1
  },
  {
    id: 6,
    question: "What is the result?",
    code: "print(10 // 3)",
    options: ["3.33", "3", "4", "Error"],
    correct: 1
  },
  {
    id: 7,
    question: "What will this code print?",
    code: "x = 'Hello'\ny = 'World'\nprint(x + ' ' + y)",
    options: ["HelloWorld", "Hello World", "Error", "None"],
    correct: 1
  },
  {
    id: 8,
    question: "What is the output?",
    code: "numbers = [1, 2, 3]\nnumbers.append(4)\nprint(numbers)",
    options: ["[1, 2, 3]", "[1, 2, 3, 4]", "Error", "[4, 1, 2, 3]"],
    correct: 1
  },
  {
    id: 9,
    question: "What will be the result?",
    code: "def add(a, b):\n    return a + b\n\nprint(add(3, 5))",
    options: ["35", "8", "Error", "None"],
    correct: 1
  },
  {
    id: 10,
    question: "What is printed?",
    code: "x = True\nprint(type(x))",
    options: ["<class 'int'>", "<class 'str'>", "<class 'bool'>", "<class 'float'>"],
    correct: 2
  },
  {
    id: 11,
    question: "What will this print?",
    code: "for i in range(3):\n    print(i)",
    options: ["0 1 2", "1 2 3", "0 1 2 3", "Error"],
    correct: 0
  },
  {
    id: 12,
    question: "What is the output?",
    code: "my_dict = {'name': 'John', 'age': 25}\nprint(my_dict['name'])",
    options: ["John", "25", "name", "Error"],
    correct: 0
  },
  {
    id: 13,
    question: "What will be printed?",
    code: "x = 5\nx += 3\nprint(x)",
    options: ["5", "3", "8", "53"],
    correct: 2
  },
  {
    id: 14,
    question: "What is the result?",
    code: "print('Python'[1:4])",
    options: ["Pyt", "yth", "ytho", "Error"],
    correct: 1
  },
  {
    id: 15,
    question: "What will this code output?",
    code: "x = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)",
    options: ["[1, 2, 3]", "[1, 2, 3, 4]", "[4]", "Error"],
    correct: 1
  },
  {
    id: 16,
    question: "What is the output?",
    code: "print(2 ** 3)",
    options: ["5", "6", "8", "9"],
    correct: 2
  },
  {
    id: 17,
    question: "What will be printed?",
    code: "x = None\nprint(type(x))",
    options: ["<class 'NoneType'>", "<class 'None'>", "<class 'null'>", "Error"],
    correct: 0
  },
  {
    id: 18,
    question: "What is the result?",
    code: "nums = [1, 2, 3, 4, 5]\nprint(nums[-1])",
    options: ["1", "2", "4", "5"],
    correct: 3
  },
  {
    id: 19,
    question: "What will this print?",
    code: "x = 'python'\nprint(x.upper())",
    options: ["python", "PYTHON", "Python", "Error"],
    correct: 1
  },
  {
    id: 20,
    question: "What is the output?",
    code: "a = 10\nb = 20\na, b = b, a\nprint(a)",
    options: ["10", "20", "30", "Error"],
    correct: 1
  }
];