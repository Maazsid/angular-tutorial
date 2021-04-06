import { Component, OnInit } from '@angular/core';
import { CoursesService } from '../shared/services/courses.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
})
export class CoursesComponent implements OnInit {
  // CHALLENGE
  // STEP 01: Display courses using ngFor
  // STEP 02: Add event handler to select course
  // STEP 03: Display raw json of selected course

  courses = null;

  selectedCourse = null;

  constructor(private coursesService: CoursesService) {}

  ngOnInit(): void {
    this.resetSelectedCourse();
    this.loadCourses();
  }

  resetSelectedCourse() {
    const emptyCourse = {
      id: null,
      title: '',
      description: '',
      percentComplete: 0,
      favorite: false,
    };
    this.selectedCourse = emptyCourse;
  }

  loadCourses() {
    this.coursesService.all().subscribe((courses) => (this.courses = courses));
  }

  refreshCourses(){
    this.resetSelectedCourse();
    this.loadCourses()
  }

  saveCourse(course) {
    if (course.id) {
      this.coursesService
        .update(course)
        .subscribe((result) => this.refreshCourses());
    } else {
      this.coursesService
        .create(course)
        .subscribe((result) => this.refreshCourses());
    }
  }

  selectCourse(course) {
    this.selectedCourse = course;
  }

  deleteCourse(courseId) {
    this.coursesService
      .delete(courseId)
      .subscribe((result) => this.refreshCourses());
  }

  cancel() {
    this.resetSelectedCourse();
  }
}
