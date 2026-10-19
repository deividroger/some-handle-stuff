package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"

	httpSwagger "github.com/swaggo/http-swagger/v2"

	"some-handle-stuff/internal/core/domain"
	"some-handle-stuff/internal/core/ports"
)

type Handler struct {
	tasks ports.TaskService
}

// CreateTaskRequest is the payload to create a task.
type CreateTaskRequest struct {
	Title string `json:"title" example:"Escrever testes"`
}

func NewHandler(tasks ports.TaskService) http.Handler {
	h := &Handler{tasks: tasks}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", h.health)
	mux.HandleFunc("GET /tasks", h.list)
	mux.HandleFunc("POST /tasks", h.create)
	mux.HandleFunc("GET /tasks/{id}", h.get)
	mux.HandleFunc("POST /tasks/{id}/complete", h.complete)
	mux.HandleFunc("DELETE /tasks/{id}", h.delete)
	mux.Handle("GET /swagger/", httpSwagger.WrapHandler)
	return mux
}

// health godoc
// @Summary Health check
// @Tags health
// @Success 200 {string} string "ok"
// @Router /healthz [get]
func (h *Handler) health(w http.ResponseWriter, _ *http.Request) {
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte("ok"))
}

// list godoc
// @Summary List tasks
// @Tags tasks
// @Produce json
// @Success 200 {array} domain.Task
// @Failure 500 {string} string "internal error"
// @Router /tasks [get]
func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	tasks, err := h.tasks.List(r.Context())
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, tasks)
}

// create godoc
// @Summary Create a task
// @Tags tasks
// @Accept json
// @Produce json
// @Param task body CreateTaskRequest true "Task to create"
// @Success 201 {object} domain.Task
// @Failure 400 {string} string "invalid request"
// @Failure 500 {string} string "internal error"
// @Router /tasks [post]
func (h *Handler) create(w http.ResponseWriter, r *http.Request) {
	var body CreateTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	task, err := h.tasks.Create(r.Context(), body.Title)
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusCreated, task)
}

// get godoc
// @Summary Get a task by ID
// @Tags tasks
// @Produce json
// @Param id path string true "Task ID"
// @Success 200 {object} domain.Task
// @Failure 404 {string} string "task not found"
// @Failure 500 {string} string "internal error"
// @Router /tasks/{id} [get]
func (h *Handler) get(w http.ResponseWriter, r *http.Request) {
	task, err := h.tasks.Get(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, task)
}

// complete godoc
// @Summary Mark a task as done
// @Tags tasks
// @Produce json
// @Param id path string true "Task ID"
// @Success 200 {object} domain.Task
// @Failure 404 {string} string "task not found"
// @Failure 500 {string} string "internal error"
// @Router /tasks/{id}/complete [post]
func (h *Handler) complete(w http.ResponseWriter, r *http.Request) {
	task, err := h.tasks.Complete(r.Context(), r.PathValue("id"))
	if err != nil {
		writeError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, task)
}

// delete godoc
// @Summary Delete a task
// @Tags tasks
// @Param id path string true "Task ID"
// @Success 204 "No Content"
// @Failure 404 {string} string "task not found"
// @Failure 500 {string} string "internal error"
// @Router /tasks/{id} [delete]
func (h *Handler) delete(w http.ResponseWriter, r *http.Request) {
	if err := h.tasks.Delete(r.Context(), r.PathValue("id")); err != nil {
		writeError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrInvalidTitle):
		http.Error(w, err.Error(), http.StatusBadRequest)
	case errors.Is(err, domain.ErrTaskNotFound):
		http.Error(w, err.Error(), http.StatusNotFound)
	default:
		http.Error(w, "internal error", http.StatusInternalServerError)
	}
}
