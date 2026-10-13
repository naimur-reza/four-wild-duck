#include <iostream>
using namespace std;

// ID: 42250303007

// Reusable component for Linear Search
int linearSearch(int arr[], int n, int target) {
    for (int i = 0; i < n; i++) {
        if (arr[i] == target) {
            return i; // Target found, return the index
        }
    }
    return -1; // Target not found
}

int main() {
    int arr[] = {45, 12, 89, 33, 7, 21};
    int n = sizeof(arr) / sizeof(arr[0]); // Dynamically calculates array size
    int target = 33;

    int result = linearSearch(arr, n, target);
    
    if (result != -1) {
        cout << "Target found at index: " << result << endl;
    } else {
        cout << "Target not in the array." << endl;
    }
    
    return 0;
}